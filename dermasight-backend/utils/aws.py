import boto3
import uuid
from config import AWS_ACCESS_KEY, AWS_SECRET_KEY, S3_BUCKET_NAME

def upload_image_to_s3(file):
    filename = str(uuid.uuid4()) + "-" + file.filename

    s3 = boto3.client(
        "s3",
        aws_access_key_id=AWS_ACCESS_KEY,
        aws_secret_access_key=AWS_SECRET_KEY
    )

    s3.upload_fileobj(file, S3_BUCKET_NAME, filename, ExtraArgs={"ACL": "public-read"})
    
    return f"https://{S3_BUCKET_NAME}.s3.amazonaws.com/{filename}"
