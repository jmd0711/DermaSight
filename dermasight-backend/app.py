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

app = Flask(__name__)

load_dotenv()

# Connect to MongoDB
app.config["MONGO_URI"] = ""
mongo = PyMongo(app)
CORS(app)

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


# Upload skin lesion image and store ML report
@app.route("/upload", methods=["POST"])
def upload_report():
    file = request.files.get("image")
    user_id = request.form.get("userId")
    condition = request.form.get("skinCondition")
    recommendations = request.form.get("recommendations")

    if not file or not user_id:
        return jsonify({"error": "Missing image or userId"}), 400
    try:
        image_url = upload_image_to_s3(file)
    except Exception as e:
        return jsonify({"error": f"S3 upload failed: {str(e)}"}), 500

    # Upload image to AWS S3 and get the URL
    image_url = upload_image_to_s3(file)

    # Save the report to MongoDB
    report = {
        "imageUrl": image_url,
        "dateGenerated": datetime.utcnow(),
        "skinCondition": condition,
        "recommendations": recommendations
    }

    result = mongo.db.DermaSight.update_one(
        {"_id": ObjectId(user_id)},
        {"$push": {"skinProblemReports": report}}
    )

    if result.modified_count == 0:
        return jsonify({"error": "User not found or report not saved"}), 404


    return jsonify({"message": "Report Uploaded", "imageUrl": image_url})

# Get treatment plan
@app.route("/treatment/<lesion_type>", methods=["GET"])
def get_treatment(lesion_type):
    treatment_data = mongo.db.treatments.find_one({"lesionType": lesion_type.lower()})
    if treatment_data:
        return jsonify({
            "lesionType": treatment_data["lesionType"],
            "treatment": treatment_data["treatment"]
        }), 200
    else:
        return jsonify({"error": "Treatment not found for this lesion type."}), 404


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
    msg = data.get("msg")      # Safely extract 'msg'
    if not msg:
        return jsonify({"error": "No message provided"}), 400

    print("Input:", msg)
    response = rag_chain.invoke({"input": msg})
    print("Response:", response["answer"])
    return jsonify({"answer": response["answer"]})

if __name__ == "__main__":
    app.run(debug=True)
