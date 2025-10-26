# app.py
from flask import Flask, request, jsonify, render_template
import joblib
import re
import numpy as np
import os

app = Flask(__name__)

# Load the trained pipeline model from models folder
try:
    # Get the absolute path to the models folder
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_dir, 'models', 'design_classifier_pipeline.pkl')
    
    print(f"Looking for model at: {model_path}")
    
    # Check if the file exists
    if not os.path.exists(model_path):
        print(f"Model file not found at: {model_path}")
        pipeline = None
    else:
        pipeline = joblib.load(model_path)
        print("Model loaded successfully!")
        
except Exception as e:
    print(f"Error loading model: {e}")
    pipeline = None

def predict_design_role(text):
    """Predict if text is artistic/design-related or not"""
    if pipeline is None:
        return None, None, None
    
    prediction = pipeline.predict([text])[0]
    probability = pipeline.predict_proba([text])[0]
    confidence = max(probability)
    
    return prediction, confidence, probability

@app.route('/')
def home():
    """Render the main page with the classification interface"""
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    """API endpoint for predictions"""
    if pipeline is None:
        return jsonify({"error": "Model not loaded"}), 500
    
    try:
        # Get text from form data or JSON
        if request.form:
            text = request.form.get('text', '')
        else:
            data = request.get_json()
            text = data.get('text', '')
            # Get assessment scores if provided
            assessment_scores = data.get('assessment_scores', None)
        
        if not text.strip():
            return jsonify({"error": "No text provided"}), 400
        
        # Make prediction
        prediction, confidence, probabilities = predict_design_role(text)
        
        if prediction is None:
            return jsonify({"error": "Prediction failed"}), 500
        
        # Get class probabilities
        classes = pipeline.classes_
        prob_dict = {cls: float(prob) for cls, prob in zip(classes, probabilities)}
        
        # Determine assessment impact based on assessment scores
        assessment_impact = 'Neutral'
        if assessment_scores and prediction.lower() == 'artistic':
            assessment_impact = 'Positive'
        
        return jsonify({
            "input_text": text,
            "prediction": prediction,
            "confidence": float(confidence),
            "probabilities": prob_dict,
            "assessment_impact": assessment_impact
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Create templates directory if it doesn't exist
    if not os.path.exists('templates'):
        os.makedirs('templates')
    
    # Create the HTML template if it doesn't exist
    template_path = os.path.join('templates', 'index.html')
    if not os.path.exists(template_path):
        # HTML content without emojis to avoid encoding issues
        html_content = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Design Role Classifier</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
        }
        textarea {
            width: 100%;
            height: 100px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
            margin-bottom: 15px;
        }
        button {
            background-color: #4CAF50;
            color: white;
            padding: 12px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            display: block;
            margin: 0 auto;
        }
        button:hover {
            background-color: #45a049;
        }
        .result {
            margin-top: 20px;
            padding: 15px;
            border-radius: 5px;
            display: none;
        }
        .artistic {
            background-color: #e8f5e9;
            border: 1px solid #c8e6c9;
        }
        .not_artistic {
            background-color: #ffebee;
            border: 1px solid #ffcdd2;
        }
        .examples {
            margin-top: 30px;
            font-size: 14px;
            color: #666;
        }
        .confidence-bar {
            height: 20px;
            background-color: #f0f0f0;
            border-radius: 10px;
            margin: 10px 0;
            overflow: hidden;
        }
        .confidence-fill {
            height: 100%;
            border-radius: 10px;
            transition: width 0.5s ease;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Design Role Classifier</h1>
        <p>Enter a job title or description to classify it as artistic/design-related or not:</p>
        
        <form id="classifyForm">
            <textarea id="textInput" placeholder="Enter job title or description to test..."></textarea>
            <button type="submit">Classify</button>
        </form>
        
        <div id="result" class="result">
            <h3>Classification Result:</h3>
            <p><strong>Input:</strong> <span id="inputText"></span></p>
            <p><strong>Prediction:</strong> <span id="prediction"></span></p>
            <p><strong>Confidence:</strong> <span id="confidence"></span></p>
            <div class="confidence-bar">
                <div id="confidenceBar" class="confidence-fill"></div>
            </div>
            <div id="probabilities"></div>
        </div>
        
        <div class="examples">
            <h3>Try these examples:</h3>
            <ul>
                <li>UI/UX designer with prototyping skills</li>
                <li>Software engineer with Python experience</li>
                <li>Graphic designer specializing in branding</li>
                <li>Data analyst with SQL expertise</li>
            </ul>
        </div>
    </div>

    <script>
        document.getElementById('classifyForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = document.getElementById('textInput').value.trim();
            
            if (!text) {
                alert('Please enter some text to classify');
                return;
            }
            
            try {
                const response = await fetch('/predict', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({ text })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    // Display results
                    document.getElementById('inputText').textContent = result.input_text;
                    document.getElementById('prediction').textContent = result.prediction;
                    document.getElementById('confidence').textContent = (result.confidence * 100).toFixed(2) + '%';
                    
                    // Update confidence bar
                    const confidenceBar = document.getElementById('confidenceBar');
                    confidenceBar.style.width = (result.confidence * 100) + '%';
                    confidenceBar.style.backgroundColor = result.prediction === 'artistic' ? '#4CAF50' : '#F44336';
                    
                    // Display probabilities
                    let probabilitiesHtml = '<strong>Probabilities:</strong><br>';
                    for (const [cls, prob] of Object.entries(result.probabilities)) {
                        probabilitiesHtml += `${cls}: ${(prob * 100).toFixed(2)}%<br>`;
                    }
                    document.getElementById('probabilities').innerHTML = probabilitiesHtml;
                    
                    // Show result with appropriate styling
                    const resultDiv = document.getElementById('result');
                    resultDiv.style.display = 'block';
                    resultDiv.className = 'result ' + (result.prediction === 'artistic' ? 'artistic' : 'not_artistic');
                    
                    // Add text icons based on prediction (no emojis)
                    document.getElementById('prediction').innerHTML = result.prediction + 
                        (result.prediction === 'artistic' ? ' (Design Role)' : ' (Non-Design Role)');
                        
                } else {
                    alert('Error: ' + result.error);
                }
            } catch (error) {
                alert('Error connecting to server: ' + error.message);
            }
        });
        
        // Add click handlers for example texts
        document.querySelectorAll('.examples li').forEach(li => {
            li.style.cursor = 'pointer';
            li.style.color = '#1976D2';
            li.addEventListener('click', () => {
                document.getElementById('textInput').value = li.textContent;
            });
        });
    </script>
</body>
</html>'''
        
        # Write with UTF-8 encoding to handle special characters
        with open(template_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        print("Created HTML template")
    
    app.run(debug=True, host='0.0.0.0', port=5001)