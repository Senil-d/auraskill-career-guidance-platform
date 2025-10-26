# test_api.py
import requests
import json
import time

def test_api():
    # Base URL of your Flask app
    BASE_URL = "http://localhost:5000"
    
    # Wait a moment for the server to start (if needed)
    time.sleep(2)
    
    print("Testing Design Text Classification API...")
    print("=" * 50)
    
    # Test 1: Health check
    print("\n1. Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")
        print("Make sure your Flask app is running!")
        return False
    
    # Test 2: Single prediction
    print("\n2. Testing single prediction...")
    test_texts = [
        "UI/UX designer with 5 years of experience creating intuitive user interfaces",
        "Software engineer with expertise in Python and Java development",
        "Graphic designer specializing in brand identity"
    ]
    
    for i, text in enumerate(test_texts, 1):
        try:
            payload = {"text": text}
            response = requests.post(f"{BASE_URL}/predict", json=payload)
            result = response.json()
            
            print(f"\nTest {i}: '{text}'")
            print(f"Prediction: {result.get('prediction', 'N/A')}")
            print(f"Confidence: {result.get('confidence', 'N/A')}")
            print(f"Status: {response.status_code}")
            
        except Exception as e:
            print(f"Error in test {i}: {e}")
    
    # Test 3: Batch prediction
    print("\n3. Testing batch prediction...")
    try:
        payload = {
            "texts": [
                "Web designer proficient in HTML, CSS, and responsive design",
                "Data analyst with strong statistical modeling skills",
                "Creative director with innovative approach"
            ]
        }
        response = requests.post(f"{BASE_URL}/batch_predict", json=payload)
        result = response.json()
        
        print(f"Batch results: {len(result.get('results', []))} texts processed")
        print(f"Status: {response.status_code}")
        
    except Exception as e:
        print(f"Error in batch test: {e}")
    
    # Test 4: Features endpoint
    print("\n4. Testing features endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/features")
        print(f"Status: {response.status_code}")
        features_data = response.json()
        print(f"Total features: {features_data.get('total_features', 'N/A')}")
        
    except Exception as e:
        print(f"Error in features test: {e}")
    
    print("\n" + "=" * 50)
    print("API testing completed!")

if __name__ == "__main__":
    test_api()