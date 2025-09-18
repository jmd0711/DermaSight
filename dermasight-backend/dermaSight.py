import os
from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from flask_cors import CORS
from bson import ObjectId
from datetime import datetime
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
from PIL import Image
import keras  # standalone Keras 3

app = Flask(__name__)

load_dotenv()

# Connect to MongoDB
app.config["MONGO_URI"] = os.getenv("MONGO_URI")
mongo = PyMongo(app)
CORS(app)

# Connect to AWS S3
AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY")
AWS_REGION = os.getenv("AWS_REGION")
BUCKET_NAME = os.getenv("BUCKET_NAME")

s3 = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    region_name=AWS_REGION
)

def upload_image_to_s3(file):
    filename = secure_filename(file.filename)
    content_type = file.content_type or "application/octet-stream"

    # Ensure file pointer is at the start
    file.seek(0)

    s3.upload_fileobj(
        Fileobj=file,
        Bucket=BUCKET_NAME,
        Key=filename,
        ExtraArgs={"ACL": "public-read", "ContentType": content_type}
    )

    url = f"https://{BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{filename}"
    return url

# Load model and labels once at startup
IMG_SIZE = (128, 128) 
ALLOWED_EXT = {"jpg", "jpeg", "png"}

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

    return jsonify({
        "message": "Login successful",
        "userId": str(user["_id"]),
        "username": user["username"]
    })

# Picture upload
def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT

def prepare(img_bytes: bytes) -> np.ndarray:
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB").resize(IMG_SIZE)
    x = np.array(img, dtype=np.float32)[None, ...]  # shape (1, H, W, 3)
    if DIVIDE_BY_255:
        x = x / 255.0
    return x

# Get skin condition by image
@app.post("/predict")
def predict():
    if "image" not in request.files:
        return jsonify({"error": "missing 'image' form field"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "empty filename"}), 400
    if not allowed_file(file.filename):
        return jsonify({"error": f"unsupported file type; use {sorted(ALLOWED_EXT)}"}), 400

    img_bytes = file.read()
    if len(img_bytes) == 0:
        return jsonify({"error": "empty file"}), 400

    try:
        x = prepare(img_bytes)
    except Exception as e:
        return jsonify({"error": f"could not read image: {str(e)}"}), 400

    preds = model.predict(x)
    probs = preds[0]  # shape (num_classes,)

    # Top-1
    top_idx = int(np.argmax(probs))
    top = {"label": CLASS_NAMES[top_idx], "prob": round(float(probs[top_idx]) * 100, 2)}

    # Top-3
    top3_idx = np.argsort(probs)[-3:][::-1]
    top3 = [{"label": CLASS_NAMES[int(i)], "prob": round(float(probs[i]) * 100, 2)}
    for i in top3_idx
    ]

    return jsonify({
        "top": top,
        "top3": top3
    })

# Upload skin lesion image and store ML report
@app.route("/upload", methods=["POST"])
def upload_report():
    file = request.files.get("image")
    user_id = request.form.get("userId")
    condition = request.form.get("skinCondition")

    # Check required inputs
    if file is None or file.filename == "":
        return jsonify({"error": "No file uploaded"}), 400
    if not user_id:
        return jsonify({"error": "Missing userId"}), 400

    try:
        image_url = upload_image_to_s3(file)
    except Exception as e:
        return jsonify({"error": f"S3 upload failed: {str(e)}"}), 500

    # Create report object
    report = {
        "imageUrl": image_url,
        "dateGenerated": datetime.utcnow(),
        "skinCondition": condition
    }

    # Save to MongoDB under user's skinProblemReports array
    result = mongo.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$push": {"skinProblemReports": report}}
    )

    if result.modified_count == 0:
        return jsonify({"error": "User not found or report not saved"}), 404

    return jsonify({"message": "Report Uploaded", "imageUrl": image_url}), 200


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