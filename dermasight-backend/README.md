# Getting Started with medical chatbot

## Set Up

In the project directory:

To download all requirements run:
### `pip install -r requirements.txt`

Add your API keys in:
### `.env`

⚠️ Must be run before using the chatbot. To initiate a pinecone index and create a knowledgebase run:
### `python store_index.py`

## Run Flask Backend

This module is for running the Flask Backend, used for getting information to and from the backend and frontend.
It is used to send skin lesion data or retrieve user information.

Different tasks can be run on an endpoint tester using the endpoints provided such as:

@app.route("/signup", methods=["POST"])

Potential inputs for the routes include jpegs of potential skin lesions
and form data for passing information

The expected outputs include json data of results

Required dependencies include:
Flask
Werkzeug
AWS
numpy
keras


###**store_index.py** Creates and populates the Pinecone vector database used by the chatbot to retrieve dermatology knowledge.

###Functionality:

Loads dermatology PDFs

1. Splits text into semantic chunks

2. Generates embeddings using HuggingFace models

3. Uploads vectors to Pinecone


###Inputs:

Dermatology PDF files stored in the Data/ directory


###Outputs:

Pinecone index (medicalbot) containing embedded dermatology literature


###Required Dependencies:

- Pinecone

- LangChain

- HuggingFace embeddings

- Python-dotenv


### **`src/helper`**
###Functionality:

Contains shared utility functions for document loading, text splitting, and embedding generation.
1. Load PDF documents

2. Split documents into manageable text chunks

3. Download and initialize embedding models


###Used By

store_index.py

dermaSight.py


###Required Dependencies:

- LangChain

- HuggingFace Transformers



###**POST /predict**
###Functionality:
Runs ML inference on an uploaded skin image without storing a report.

###Input:
image — image file (jpg, png, webp, heic, etc.)

###Output (Success – 200):
JSON with top 3 ML prediction




###**POST /ask**
###Functionality:
Allows users to ask dermatology-related questions.
The chatbot:
-Uses the user's latest skin report (if available)
-Retrieves relevant dermatology literature from Pinecone
-Responds using a Gemini-powered LLM
-Maintains per-user conversation memory

###Input:
Input (JSON) question

###Output (Success – 200):
JSON with concise dermatology-focused response, skin report used, and chat history

###Behavior Notes

-Non-medical questions are rejected

-Non-dermatology medical questions are redirected

-If no report exists, general dermatology guidance is provided

In DermaSight/dermasight-backend run
### `python dermaSight.py`
