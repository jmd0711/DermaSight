# Getting Started with medical chatbot

## Set Up

In the project directory:

To download all requirements run:
### `pip install -r requirements.txt`

### Add your keys in env:

```text
PINECONE_API_KEY=...
PINECONE_ENV=...
LLM_API_KEY=...
```

---

## Initializing the Knowledge Base

⚠️ **Must be run before using the chatbot**

To create and populate the Pinecone vector database with dermatology literature:

```bash
python store_index.py
```

This process:
- Loads dermatology PDFs from the `Data/` directory
- Splits documents into semantic chunks
- Generates embeddings using HuggingFace models
- Uploads vectors to Pinecone (`medicalbot` index)

---

## Run Flask Backend

This module is for running the Flask Backend, used for getting information to and from the backend and frontend.
It is used to send skin lesion data or retrieve user information.

Start the backend server from this directory:

```bash
python dermaSight.py
```

## API Endpoints
Different tasks can be run on an endpoint tester using the endpoints provided such as:

### **POST `/signup`**
Potential inputs for the routes include jpegs of potential skin lesions
and form data for passing information

The expected outputs include json data of results

Required dependencies include:
Flask
Werkzeug
AWS
numpy
keras


---

### **POST `/predict`**

Runs ML inference on an uploaded skin image without storing a report.

**Input**:
- `image`: Image file (`jpg`, `png`, `webp`, `heic`, etc.)

**Output (200 OK)**:
```json
{
  "predictions": [
    { "label": "melanoma", "confidence": 0.72 },
    { "label": "nevus", "confidence": 0.18 },
    { "label": "benign_keratosis", "confidence": 0.10 }
  ]
}
```

---

### **POST `/ask`**

Allows users to ask dermatology-related questions.

The chatbot:
- Uses the user’s latest skin report (if available)
- Retrieves relevant dermatology literature from Pinecone
- Responds using a Gemini-powered LLM
- Maintains per-user conversation memory

**Input**:
```json
{
  "question": "What are common signs of melanoma?"
}
```

**Output (200 OK)**:
```json
{
  "response": "Common signs of melanoma include asymmetry...",
  "skin_report_used": true,
  "chat_history": []
}
```

**Behavior Notes**:
- Non-medical questions are rejected
- Non-dermatology medical questions are redirected
- If no skin report exists, general dermatology guidance is provided

---

## `store_index.py`

Creates and populates the Pinecone vector database used by the chatbot.

### Functionality
1. Loads dermatology PDF documents
2. Splits text into semantic chunks
3. Generates embeddings with HuggingFace
4. Uploads vectors to Pinecone

### Inputs
- PDF files in the `Data/` directory

### Outputs
- Pinecone index named `medicalbot`

### Required Dependencies
- Pinecone
- LangChain
- HuggingFace Embeddings
- python-dotenv

---

## `src/helper`

Shared utility module used across the project.

### Functionality
- Load PDF documents
- Split documents into manageable text chunks
- Initialize and manage embedding models

### Used By
- `store_index.py`
- `dermaSight.py`

### Required Dependencies
- LangChain
- HuggingFace Transformers

---

## Core Dependencies

- Flask
- Werkzeug
- NumPy
- Keras
- LangChain
- Pinecone
- HuggingFace Transformers & Embeddings
- AWS SDK

---

## Notes

- This backend is designed to be paired with a frontend client
- The chatbot is restricted to dermatology-related medical queries
- ML predictions should not be interpreted as medical diagnoses

This project is intended for academic and research use only.
