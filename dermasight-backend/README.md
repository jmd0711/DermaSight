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



# DermaSight Ensemble Model - Branch: pushpal/ensemble to checkout the ensemble model and also in the only PR left!!! 

This branch contains the implementation of an ensemble machine learning model for skin disease classification in the DermaSight application. The ensemble combines three different models trained on distinct dermatology datasets to improve prediction accuracy and robustness.

## Ensemble Architecture

The ensemble model uses a **weighted average voting strategy** to combine predictions from three specialized models:

### Model Configuration

| Model Name | Dataset Source | Accuracy | Weight | Classes |
|------------|----------------|----------|---------|---------|
| HAM10000 | HAM10000 Skin Cancer Dataset | 84.24% | 0.40 | 7 skin lesion types |
| Skin_Diseases | Skin Disease Classification Dataset | 79.09% | 0.37 | 9 common skin diseases |
| DermNet | DermNet Skin Disease Dataset | 71.32% | 0.23 | 23 skin disease categories |

### Ensemble Strategy
- **Voting Method**: Weighted average of model predictions
- **Image Size**: 224×224 pixels (standardized across all models)
- **Weight Assignment**: Based on individual model accuracy scores
- **Final Prediction**: Highest weighted confidence score across all models

## Datasets Used

### 1. HAM10000 Dataset
**Source**: [Kaggle - Skin Cancer MNIST: HAM10000](https://www.kaggle.com/datasets/kmader/skin-cancer-mnist-ham10000)

- **Images**: 10,015 dermatoscopic images
- **Size**: ~5.58 GB
- **Classes**: 7 diagnostic categories
  1. Actinic keratoses
  2. Basal cell carcinoma
  3. Benign keratosis-like lesions
  4. Dermatofibroma
  5. Melanoma
  6. Melanocytic nevi
  7. Vascular lesions
- **Quality**: Over 50% of lesions confirmed through histopathology
- **Purpose**: Academic machine learning for automated diagnosis of pigmented skin lesions

### 2. DermNet Dataset
**Source**: [Kaggle - DermNet](https://www.kaggle.com/datasets/shubhamgoel27/dermnet)

- **Images**: ~19,500 images (15,500 training, 4,000 test)
- **Size**: ~1.85 GB
- **Classes**: 23 types of skin diseases including:
  - Acne
  - Melanoma
  - Eczema
  - Seborrheic keratoses
  - Tinea ringworm
  - Bullous disease
  - Poison ivy
  - Psoriasis
  - Vascular tumors
  - And 14 additional categories
- **Source**: Images from dermnet.com
- **License**: CC BY-NC-ND 4.0
- **Format**: JPEG with RGB channels

### 3. Skin Disease Classification Dataset
**Source**: [Kaggle - CNN Implementation](https://www.kaggle.com/code/rohitganeshkar/skin-disease-image-datasetcnn)

- **Images**: Comprehensive collection for CNN training
- **Purpose**: General skin disease classification using convolutional neural networks
- **Implementation**: Optimized for deep learning architectures
- **Focus**: Common dermatological conditions for clinical applications

## Implementation Details

### Ensemble Prediction Process

1. **Image Preprocessing**
   - Resize to 224×224 pixels
   - RGB conversion
   - Normalization (pixel values ÷ 255.0)
   - Batch dimension addition

2. **Multi-Model Inference**
   ```python
   # Each model processes the same preprocessed image
   ham10000_prediction = ham10000_model.predict(image)
   skin_diseases_prediction = skin_diseases_model.predict(image)
   dermnet_prediction = dermnet_model.predict(image)
   ```

3. **Weighted Aggregation**
   ```python
   # Combine predictions using model weights
   final_score = (ham10000_pred * 0.40) +
                 (skin_diseases_pred * 0.37) +
                 (dermnet_pred * 0.23)
   ```

4. **Class Name Normalization**
   - Standardizes class names across different model vocabularies
   - Handles variations in naming conventions (underscores, hyphens, case)

### Key Features

- **Silent Model Loading**: Suppressed TensorFlow/Keras logging for clean startup
- **Error Handling**: Robust image preprocessing with format validation
- **Compatibility**: Maintains backward compatibility with existing API endpoints
- **Performance Monitoring**: Individual model confidence tracking
- **Flexible Top-K**: Configurable number of top predictions

### API Endpoints

#### `/api/predict` (New Ensemble Endpoint)
```json
{
  "success": true,
  "prediction": {
    "class": "Melanoma",
    "confidence": "87.45%"
  },
  "top_predictions": [...],
  "model_breakdown": {
    "HAM10000": {"prediction": "Melanoma", "confidence": "89.2%", "weight": 0.40},
    "Skin_Diseases": {"prediction": "Skin Cancer", "confidence": "85.1%", "weight": 0.37},
    "DermNet": {"prediction": "Melanoma", "confidence": "82.7%", "weight": 0.23}
  }
}
```

#### `/upload` (Legacy Compatibility)
- Maintains original response format
- Uses ensemble predictions internally
- Seamless integration with existing mobile/web clients

## Benefits of Ensemble Approach

1. **Improved Accuracy**: Combines strengths of multiple specialized models
2. **Reduced Overfitting**: Diverse training datasets minimize model bias
3. **Robustness**: Better performance on edge cases and rare conditions
4. **Confidence Calibration**: More reliable confidence scores through weighted averaging
5. **Domain Coverage**: Broader range of skin conditions across three datasets

## Technical Requirements

- TensorFlow/Keras
- PIL (Python Imaging Library)
- NumPy
- Flask (for API)
- Model files stored in `/models/` directory with corresponding class definitions

## Configuration

Model configuration is managed through `models/ensemble_config.json`:

```json
{
  "models": [...],
  "voting_strategy": "weighted_average",
  "img_size": 224
}
```

## Future Enhancements

- Dynamic weight adjustment based on prediction confidence
- Addition of more specialized models (pediatric dermatology, rare diseases)
- Real-time model performance monitoring
- A/B testing framework for ensemble optimization

---

## Getting Started with medical chatbot

### Set Up

In the project directory:

To download all requirements run:
#### `pip install -r requirements.txt`

Add your API keys in:
#### `.env`

To initiate a pinecone index and create a knowledgebase run:
#### `python store_index.py`

### Run
In DermaSight/dermasight-backend run
#### `python dermaSight.py`

---

*This ensemble implementation significantly improves DermaSight's diagnostic capabilities by leveraging the collective knowledge of three distinct dermatology datasets and their trained models.*
