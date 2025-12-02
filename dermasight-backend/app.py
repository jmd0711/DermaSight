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
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
from src.prompt import *
import boto3
from werkzeug.utils import secure_filename
import tensorflow as tf
import numpy as np, json, io, os
from PIL import Image, UnidentifiedImageError
import keras 
import traceback
from typing import Optional, Tuple, Dict, Any
from pillow_heif import register_heif_opener
register_heif_opener()


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
user_memories: dict[str, ConversationBufferMemory] = {}

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
    
    docs = mongo.db.treatments.find({})
    for doc in docs:
        if doc["lesionType"].lower() in top["label"].lower():
            condition = doc
            break

    id = ObjectId()

    # Create report object
    report = {
        "_id": id,
        "report_id": str(id),
        "imageUrl": image_url,
        "dateGenerated": datetime.utcnow(),
        "location": location,
        "size": size,
        "duration": duration,
        "symptoms": symptoms,
        "additional": additional,
        "skinCondition": top["label"],
        "confidence": top["prob"],
        "treatment": condition["treatment"]
    }

    # Save report to user's profile
    result = mongo.db.users.update_one(
        {"_id": uid},
        {"$push": {"skinProblemReports": report}}
    )

    if result.modified_count == 0:
        return jsonify({"error": "User not found or report not saved"}), 404

    return jsonify({"message": "Report Uploaded", 
                    "report_id": str(id),
                    "imageUrl": image_url,
                    "dateGenerated": datetime.utcnow(),
                    "location": location,
                    "size": size,
                    "duration": duration,
                    "symptoms": symptoms,
                    "additional": additional,
                    "skinCondition": top["label"],
                    "confidence": top["prob"],
                    "treatment": condition["treatment"]}), 200

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
        {"$pull": {"skinProblemReports": {"report_id": report_id}}}
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

system_prompt = (
    "You are a dermatology assistant. You must answer strictly from the retrieved "
    "dermatology book documents and, when available, the user's latest skin report that is "
    "stored in memory and describes what skin lesion user has. If a question is outside dermatology, refuse and redirect the user. "
    "Be concise, medically responsible."
)

# Prompt for ConversationalRetrievalChain
combine_prompt = ChatPromptTemplate.from_messages([
    ("system", "{system_prompt}"),
    ("human",
     "Use ONLY the provided context (dermatology sources and any saved user skin report details) "
     "to answer the user's question about their skin problem indicated in the report.\n\n"
     "Context:\n{context}\n\n"
     "Question: {question}\n\n"
     "Write your response as if speaking directly to the user — "
     "avoid phrases like 'based on the provided text' or 'the context says'. "
     "Integrate the information naturally, as though you already know it.")
]).partial(system_prompt=system_prompt)

assert set(combine_prompt.input_variables) == {"context", "question"}

def get_or_create_memory(user_id: str) -> ConversationBufferMemory:
    if user_id not in user_memories:
        user_memories[user_id] = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True,
        )
    return user_memories[user_id]

def classify_question_with_gemini(msg: str) -> str:
    """
    Returns one of: 'dermatology', 'medical_non_dermatology', 'non_medical'
    """
    cls_prompt = (
        "You are a medical domain classifier. Categorize the user's message into "
        "one of three labels:\n"
        "- 'dermatology': about skin, lesions, moles, rashes, acne, eczema, etc.\n"
        "- 'medical_non_dermatology': other medical topics.\n"
        "- 'non_medical': anything else.\n\n"
        f"User message: \"{msg}\"\n"
        "Respond with only the label: dermatology, medical_non_dermatology, or non_medical."
    )
    result = llm.invoke(cls_prompt)  # pass a plain string
    label = (result.content or "").strip().lower()
    if "dermatology" in label:
        return "dermatology"
    elif "medical" in label:
        return "medical_non_dermatology"
    else:
        return "non_medical"

def fetch_latest_report(uid: ObjectId) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    user = mongo.db.users.find_one({"_id": uid}, {"skinProblemReports": {"$slice": -1}})
    if not user:
        print("[fetch_latest_report] user not found")
        return None, "user_not_found"

    reports = user.get("skinProblemReports") or []
    if reports:
        print(f"[fetch_latest_report] got last report via $slice: -1 (count={len(reports)})")
        return reports[0], None  # with $slice:-1 we get a list of 1 (the last)

    # Fallback: get the whole array to be sure
    user_all = mongo.db.users.find_one({"_id": uid}, {"skinProblemReports": 1})
    if not user_all:
        print("[fetch_latest_report] user missing on second lookup")
        return None, "user_not_found"

    all_reports = user_all.get("skinProblemReports") or []
    if all_reports:
        print(f"[fetch_latest_report] got reports via full fetch (count={len(all_reports)})")
        last = all_reports[-1]
        return last, None

    print("[fetch_latest_report] no reports present")
    return None, None

@app.route("/ask", methods=["POST"])
@jwt_required()
def ask():
    try:
        identity = get_jwt_identity()
        try:
            uid = ObjectId(identity)
        except InvalidId:
            return jsonify({"error": "Invalid user ID"}), 401

        data = request.get_json(silent=True) or {}
        msg = (data.get("msg") or "").strip()
        if not msg:
            return jsonify({"error": "Missing 'msg' field"}), 400

        # Ensure per-user memory
        if identity not in user_memories:
            user_memories[identity] = ConversationBufferMemory(
                memory_key="chat_history",
                return_messages=True
            )
        memory = user_memories[identity]

        # Fetch latest report
        latest_report, fetch_err = fetch_latest_report(uid)
        if fetch_err == "user_not_found":
            return jsonify({"error": "User not found"}), 404

        # If no report, classify the query
        if not latest_report:
            topic = classify_question_with_gemini(msg)

            if topic == "non_medical":
                return jsonify({
                    "answer": "I’m a dermatology AI assistant. Please ask about skin lesions or related skin conditions.",
                    "report_used": None
                }), 200

            if topic == "medical_non_dermatology":
                return jsonify({
                    "answer": "I can only provide information about skin health and dermatology. "
                              "For other medical topics, please consult a general healthcare provider.",
                    "report_used": None
                }), 200

            # Dermatology topic → general advice
            general_prompt = (
                f"The user has no stored skin lesion report. They asked: '{msg}'.\n\n"
                "Provide an accurate, concise dermatology answer. "
                "If they describe a lesion or symptom, suggest uploading a photo for AI analysis."
            )
            response = llm.invoke(general_prompt)
            memory.save_context({"input": msg}, {"output": response.content})

            return jsonify({
                "answer": response.content,
                "report_used": None,
                "chat_history": [
                    {"role": m.type, "text": getattr(m, 'content', str(m))}
                    for m in memory.chat_memory.messages
                ]
            }), 200

        # Report exists → print it before answering
        print("\n User's Latest Dermatology Report (loaded)")
        print(f"Predicted Condition: {latest_report.get('skinCondition', 'N/A')}")
        print(f"Confidence: {latest_report.get('confidence', 'N/A')}")
        print(f"Treatment: {latest_report.get('treatment', 'N/A')}")
        print(f"Location: {latest_report.get('location', 'unknown')}")
        print(f"Size: {latest_report.get('size', 'unknown')}")
        print(f"Duration: {latest_report.get('duration', 'unknown')}")
        print(f"Symptoms: {', '.join(latest_report.get('symptoms', [])) or 'none'}")
        print(f"Additional Notes: {latest_report.get('additional', 'none')}")
        print("================================================\n")

        # Save report into memory
        symptoms = latest_report.get("symptoms") or []
        memory.save_context(
            {"input": "system"},
            {"output": (
                f"User dermatology report summary:\n"
                f"- Predicted condition: {latest_report.get('skinCondition', 'N/A')} "
                f"(confidence: {latest_report.get('confidence', 'N/A')})\n"
                f"- Treatment: {latest_report.get('treatment', 'N/A')}\n"
                f"- Location: {latest_report.get('location', 'unknown')}\n"
                f"- Size: {latest_report.get('size', 'unknown')}\n"
                f"- Duration: {latest_report.get('duration', 'unknown')}\n"
                f"- Symptoms: {', '.join(symptoms) if symptoms else 'none'}\n"
                f"- Notes: {latest_report.get('additional', 'none')}"
            )}
        )

        # Conversational RAG
        conversational_chain = ConversationalRetrievalChain.from_llm(
            llm=llm,
            retriever=retriever,
            memory=memory,
            combine_docs_chain_kwargs={"prompt": combine_prompt},
            return_source_documents=False,
        )

        out = conversational_chain.invoke({"question": msg})

        return jsonify({
            "answer": out.get("answer", ""),
            "report_used": latest_report,
            "chat_history": [
                {"role": m.type, "text": getattr(m, 'content', str(m))}
                for m in memory.chat_memory.messages
            ]
        }), 200

    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)