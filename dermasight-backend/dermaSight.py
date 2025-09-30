import os
from flask import Flask, request, jsonify
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity,
)
from flask_pymongo import PyMongo
from flask_cors import CORS
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timedelta
from config import MONGO_URI
from utils.aws import upload_image_to_s3
from werkzeug.security import generate_password_hash, check_password_hash
from src.helper import download_hugging_face_embeddings
from langchain_pinecone import PineconeVectorStore
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
from src.prompt import *
import boto3
from werkzeug.utils import secure_filename
import tensorflow as tf
import numpy as np, json, io, os
from PIL import Image, UnidentifiedImageError
import keras  # standalone Keras 3
# at startup
from pillow_heif import register_heif_opener
register_heif_opener()


app = Flask(__name__)

load_dotenv()

# Connect to MongoDB
app.config["MONGO_URI"] = os.environ.get('MONGO_URI')

#Configure JWT
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY") or "dev-only-change-me" #change this later
app.config["JWT_TOKEN_LOCATION"] = ["headers"]
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=7)

jwt = JWTManager(app)
mongo = PyMongo(app)
CORS(app)

# Connect to AWS S3
AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY")
AWS_REGION = os.getenv("AWS_REGION")
BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

s3 = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    region_name=AWS_REGION
)

def upload_image_to_s3_bytes(img_bytes: bytes, filename: str, content_type: str | None):
    filename = secure_filename(filename)
    content_type = content_type or "application/octet-stream"

    bio = io.BytesIO(img_bytes)
    bio.seek(0)  # ensure pointer at start

    s3.upload_fileobj(
        Fileobj=bio,
        Bucket=BUCKET_NAME,
        Key=filename,
        ExtraArgs={"ACL": "public-read", "ContentType": content_type},
    )
    return f"https://{BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{filename}"

def predict_from_bytes(img_bytes: bytes):
    if not img_bytes:
        raise ValueError("empty file")

    x = prepare(img_bytes)  
    probs = model.predict(x)[0]
    top_idx = int(np.argmax(probs))
    top = {"label": CLASS_NAMES[top_idx], "prob": round(float(probs[top_idx]) * 100, 2)}
    top3_idx = np.argsort(probs)[-3:][::-1]
    top3 = [{"label": CLASS_NAMES[int(i)], "prob": round(float(probs[i]) * 100, 2)} for i in top3_idx]
    return top, top3
# Load model and labels once at startup
IMG_SIZE = (128, 128) 
ALLOWED_EXT = {"jpg", "jpeg", "png", "webp", "heic", "heif", "avif"}

DIVIDE_BY_255 = False

model = keras.models.load_model("skin_mobilenetv3.keras", compile=False)
with open("mobilenetv3_labels.json") as f:
    CLASS_NAMES = json.load(f)

@app.route("/")
def index():
    return "DermaSight API is running!"

# Register a new user
@app.route("/signup", methods=["POST"])
def create_user():
    data = request.get_json()

    if not all([data.get("username"), data.get("email"), data.get("password")]):
        return jsonify({"error": "Missing user data"}), 400
    
    users = mongo.db.users

    existing_user = users.find_one({"email": data["email"]})
    if existing_user:
        return jsonify({"error": "Email already registered"}), 409
    
    existing = users.find_one({"username": data["username"]})
    if existing:
        return jsonify({"error": "Username already in use" }), 409

    user = {
        "username": data["username"],
        "email": data["email"],
        "password": generate_password_hash(data["password"]),
        "age": data["age"],
        "skinProblemReports": []
    }
    result = users.insert_one(user)
    return jsonify({"userId": str(result.inserted_id)}), 201

# Login
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400

    users = mongo.db.users
    user = users.find_one({"username": username})
    if not user:
        return jsonify({"error": "User not found"}), 404

    if not check_password_hash(user["password"], password):
        return jsonify({"error": "Incorrect password"}), 401
    
    identity = str(user["_id"])
    claims = {"role": user.get("role", "user")}
    access = create_access_token(identity=identity, additional_claims=claims)
    refresh = create_refresh_token(identity=identity, additional_claims=claims)

    return jsonify({
        "message": "Login successful",
        "userId": str(user["_id"]),
        "username": user["username"],
        "access": access, 
        "refresh": refresh
    })

@app.post("/auth/refresh")
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    new_access = create_access_token(identity=identity)
    return {"access": new_access}, 200


# Picture upload
def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT

def prepare(img_bytes: bytes) -> np.ndarray:
    try:
        with Image.open(io.BytesIO(img_bytes)) as test_im:
            test_im.verify() 
        with Image.open(io.BytesIO(img_bytes)) as im:
            im = im.convert("RGB").resize(IMG_SIZE)
            x = np.array(im, dtype=np.float32)[None, ...]
    except UnidentifiedImageError:
        raise ValueError("unsupported or corrupt image format (try JPG/PNG).")
    except OSError as e:
        raise ValueError(f"image decode error: {e}")

    if DIVIDE_BY_255:
        x = x / 255.0
    return x

# Get skin condition by image
@app.post("/predict")
def predict():
    file = request.files.get("image")
    try:
        top, top3 = predict_from_file(file)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    return jsonify({"top": top, "top3": top3})

# Upload skin lesion image and store ML report
@app.route("/upload", methods=["POST"])
@jwt_required()
def upload_report():
    file = request.files.get("image")
    condition = request.form.get("skinCondition")

    user_id = get_jwt_identity()
    try:
        uid = ObjectId(user_id)
    except InvalidId:
        return jsonify({"error": "Invalid user identity"}), 401

    # Check required inputs
    if file is None or file.filename == "":
        return jsonify({"error": "No file uploaded"}), 400
    if not user_id:
        return jsonify({"error": "Missing userId"}), 400

    
    img_bytes = file.read() 
    if not img_bytes:
        return jsonify({"error": "empty file"}), 400

    try:
        top, top3 = predict_from_bytes(img_bytes)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    
    try:
        image_url = upload_image_to_s3_bytes(img_bytes, file.filename, file.mimetype)
    except Exception as e:
        return jsonify({"error": f"S3 upload failed: {e.__class__.__name__}: {e}"}), 502

    condition = mongo.db.treatments.find_one(
        { "lesionType": top["label"]}
    )
    # Create report object
    report = {
        "imageUrl": image_url,
        "dateGenerated": datetime.utcnow(),
        "skinCondition": top["label"],
        "confidence": top["prob"],
        "treatment": condition["treatment"]
    }

    # Save to MongoDB under user's skinProblemReports array
    result = mongo.db.users.update_one(
        {"_id": ObjectId(uid)},
        {"$push": {"skinProblemReports": report}}
    )

    if result.modified_count == 0:
        return jsonify({"error": "User not found or report not saved"}), 404

    return jsonify({"message": "Report Uploaded", 
                    "imageUrl": image_url,
                    "top": top,
                    "top3": top3}), 200


# Chatbot
PINECONE_API_KEY=os.environ.get('PINECONE_API_KEY')
GOOGLE_API_KEY=os.environ.get('GOOGLE_API_KEY')

os.environ["PINECONE_API_KEY"] = PINECONE_API_KEY
os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY

embeddings = download_hugging_face_embeddings()
index_name = "medicalbot"
# Embed each chunk and upsert the embeddings into your Pinecone index.
docsearch = PineconeVectorStore.from_existing_index(
    index_name=index_name,
    embedding=embeddings
)

retriever = docsearch.as_retriever(search_type="similarity", search_kwargs={"k":3})

llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2
)

prompt = ChatPromptTemplate.from_messages(
    [
        ("system", system_prompt),
        ("human", "{input}"),
    ]
)

question_answer_chain = create_stuff_documents_chain(llm, prompt)
rag_chain = create_retrieval_chain(retriever, question_answer_chain)

# Change the route
@app.route("/ask", methods=["GET", "POST"])
def chat():
    data = request.get_json()  # Parse JSON body
    msg = data.get("msg")      # Extract 'msg'
    if not msg:
        return jsonify({"error": "No message provided"}), 400

    print("Input:", msg)
    response = rag_chain.invoke({"input": msg})
    print("Response:", response["answer"])
    return jsonify({"answer": response["answer"]})

if __name__ == "__main__":
    app.run(debug=True)