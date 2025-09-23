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
from PIL import Image
import keras  # standalone Keras 3

app = Flask(__name__)

load_dotenv()

# Connect to MongoDB
app.config["MONGO_URI"] = os.environ.get('MONGO_URI')

#Configure JWT
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY") or "f1e3b5c8d2a1f6e7c9b8d7a6e4c3f2b1d0a9e8f7c6b5d4a3e2f1c0b9d8a7e6f5" #change this later
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
    
    existing = users.find_one({"username": data["username"]})
    if existing:
        return jsonify({"error": "Username already in use" }), 409

    user = {
        "username": data["username"],
        "email": data["email"],
        "password": generate_password_hash(data["password"]),
        "age": data.get("age"),  # use .get() so missing age is None
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

# Upload skin lesion image, questionnaire + store ML report
@app.route("/upload", methods=["POST"])
@jwt_required()
def upload_report():
    file = request.files.get("image")
    location = request.form.get("location")
    size = request.form.get("size")
    duration = request.form.get("duration")
    symptoms = request.form.getlist("symptoms")
    additional = request.form.get("additional", "")
    
    user_id = get_jwt_identity()
    try:
        uid = ObjectId(user_id)
    except:
        return jsonify({"error": "Invalid user identity"}), 401

    # Validate
    if file is None or file.filename == "":
        return jsonify({"error": "No file uploaded"}), 400

    # Upload image to S3 (or wherever)
    try:
        image_url = upload_image_to_s3(file)
    except Exception as e:
        return jsonify({"error": f"S3 upload failed: {str(e)}"}), 500

    # Run prediction
    try:
        file.seek(0)
        img_bytes = file.read()
        x = prepare(img_bytes)  # preprocess for ML model
        preds = model.predict(x)
        probs = preds[0]
        top_idx = int(np.argmax(probs))
        skin_condition = CLASS_NAMES[top_idx]
        confidence = round(float(probs[top_idx]) * 100, 2)
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

    # Create report object
    report = {
        "imageUrl": image_url,
        "dateGenerated": datetime.utcnow(),
        "location": location,
        "size": size,
        "duration": duration,
        "symptoms": symptoms,
        "additional": additional,
        "skinCondition": skin_condition,
        "confidence": confidence,
    }

    # Save report to user's profile
    result = mongo.db.users.update_one(
        {"_id": uid},
        {"$push": {"skinProblemReports": report}}
    )

    if result.modified_count == 0:
        return jsonify({"error": "User not found or report not saved"}), 404

    return jsonify({
        "message": "Report Uploaded",
        "imageUrl": image_url,
        "skinCondition": skin_condition,
        "confidence": confidence,
        "report": report
    }), 200

# Get User reports
@app.route("/user/reports", methods=["GET"])
@jwt_required()
def get_user_reports():
    user_id = get_jwt_identity()
    try:
        uid = ObjectId(user_id)
    except InvalidId:
        return jsonify({"error": "Invalid user identity"}), 401

    user = mongo.db.users.find_one({"_id": uid}, {"skinProblemReports": 1})
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"reports": user.get("skinProblemReports", [])}), 200

# Delete Report
@app.route("/user/reports/<report_id>", methods=["DELETE"])
@jwt_required()
def delete_report(report_id):
    user_id = get_jwt_identity()
    try:
        uid = ObjectId(user_id)
    except:
        return jsonify({"error": "Invalid user ID"}), 401

    result = mongo.db.users.update_one(
        {"_id": uid},
        {"$pull": {"skinProblemReports": {"_id": ObjectId(report_id)}}}
    )

    if result.modified_count == 0:
        return jsonify({"error": "Report not found"}), 404

    return jsonify({"message": "Report deleted"}), 200

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

@app.route("/ask", methods=["POST"])
@jwt_required()
def chat():
    user_id = get_jwt_identity()
    try:
        uid = ObjectId(user_id)
    except Exception:
        return jsonify({"error": "Invalid user ID"}), 401

    data = request.get_json()
    msg = data.get("msg")
    if not msg:
        return jsonify({"error": "No message provided"}), 400

    # Fetch most recent report from user's skinProblemReports
    user = mongo.db.users.find_one(
        {"_id": uid},
        {"skinProblemReports": {"$slice": -1}}  # only last report
    )

    latest_report = None
    if user and "skinProblemReports" in user and len(user["skinProblemReports"]) > 0:
        latest_report = user["skinProblemReports"][0]

    # Inject context from latest report
    if latest_report:
        context_prompt = (
            f"User has a skin lesion with the following details:\n"
            f"- Location: {latest_report.get('location', 'unknown')}\n"
            f"- Size: {latest_report.get('size', 'unknown')}\n"
            f"- Duration: {latest_report.get('duration', 'unknown')}\n"
            f"- Symptoms: {', '.join(latest_report.get('symptoms', [])) or 'none'}\n"
            f"- Notes: {latest_report.get('additional', 'none')}\n"
            f"- Predicted condition: {latest_report.get('skinCondition', 'N/A')} "
            f"(confidence {latest_report.get('confidence', 'N/A')}%)\n\n"
            f"Now the user says: {msg}"
        )
    else:
        context_prompt = f"User has no reports saved. The user says: {msg}"

    response = rag_chain.invoke({"input": context_prompt})

    return jsonify({
        "answer": response["answer"],
        "report_used": latest_report
    })


if __name__ == "__main__":
    app.run(debug=True)