# Getting Started with medical chatbot

## Set Up

In the project directory:

To download all requirements run:
### `pip install -r requirements.txt`

Add your API keys in:
### `.env`

To initiate a pinecone index and create a knowledgebase run:
### `python store_index.py`

## Run Flask Backend

This module is for running the Flask Backend, used for getting information to and from the backend and frontend.
It is used to send skin lesion data or retrieve user information.

Different tasks can be run on an endpoint tester using the endpoints provided such as:

@app.route("/signup", methods=["POST"])

In DermaSight/dermasight-backend run
### `python dermaSight.py`
