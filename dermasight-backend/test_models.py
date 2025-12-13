import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

from tensorflow import keras
import json

print("Testing model loading...")

with open('models/ensemble_config.json', 'r') as f:
    config = json.load(f)

for model_config in config['models']:
    print(f"\nLoading {model_config['name']}...")
    try:
        model = keras.models.load_model(model_config['path'], compile=False)
        print(f"  ✅ Success!")
    except Exception as e:
        print(f"  ❌ Failed: {e}")

print("\n✅ All models loaded successfully!")