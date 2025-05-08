import os
from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from flask_cors import CORS
from bson import ObjectId
from datetime import datetime
from config import MONGO_URI
from utils.aws import upload_image_to_s3
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

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

if __name__ == "__main__":
    app.run(debug=True)
