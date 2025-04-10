from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from bson import ObjectId
from datetime import datetime
from config import MONGO_URI
from utils.aws import upload_image_to_s3

app = Flask(__name__)

# Connect to MongoDB
app.config["MONGO_URI"] = MONGO_URI
mongo = PyMongo(app)

@app.route("/")
def index():
    return "Welcome to the DermaSight API!"

# Create a new user (for demo purposes)
@app.route("/user", methods=["POST"])
def create_user():
    data = request.get_json()
    user = {
        "username": data.get("username"),
        "email": data.get("email"),
        "password": data.get("password"),
        "age": data.get("age"),
        "skinProblemReports": []
    }
    result = mongo.db.users.insert_one(user)
    return jsonify({"userId": str(result.inserted_id)})

# Upload skin lesion image and store ML report
@app.route("/upload", methods=["POST"])
def upload_report():
    file = request.files.get("image")
    user_id = request.form.get("userId")
    condition = request.form.get("skinCondition")
    recommendations = request.form.get("recommendations")

    if not file or not user_id:
        return jsonify({"error": "Missing data"}), 400

    # Upload image to AWS S3 and get the URL
    image_url = upload_image_to_s3(file)

    # Save the report to MongoDB
    report = {
        "imageUrl": image_url,
        "dateGenerated": datetime.utcnow(),
        "skinCondition": condition,
        "recommendations": recommendations
    }

    mongo.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$push": {"skinProblemReports": report}}
    )

    return jsonify({"message": "Uploaded", "imageUrl": image_url})

if __name__ == "__main__":
    app.run(debug=True)
