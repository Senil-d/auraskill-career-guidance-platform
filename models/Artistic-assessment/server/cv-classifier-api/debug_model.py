# debug_model.py
import os
import joblib

# Check current directory and models folder
current_dir = os.path.dirname(os.path.abspath(__file__))
print(f"Current directory: {current_dir}")

models_dir = os.path.join(current_dir, 'models')
print(f"Models directory: {models_dir}")

# Check if models directory exists
if os.path.exists(models_dir):
    print("Models directory exists")
    files = os.listdir(models_dir)
    print(f"Files in models directory: {files}")
    
    # Check if our model file exists
    model_path = os.path.join(models_dir, 'design_classifier_pipeline.pkl')
    if os.path.exists(model_path):
        print("Model file found!")
        try:
            # Try to load the model
            model = joblib.load(model_path)
            print("Model loaded successfully!")
            print(f"Model type: {type(model)}")
        except Exception as e:
            print(f"Error loading model: {e}")
    else:
        print("Model file not found in models directory")
else:
    print("Models directory does not exist")