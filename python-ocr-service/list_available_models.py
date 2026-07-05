#!/usr/bin/env python3
"""
Script to list available Gemini models
"""

import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

if not GEMINI_API_KEY:
    print("❌ GEMINI_API_KEY not found in .env file")
    exit(1)

print("🔍 Listing available Gemini models...")
print(f"API Key: {GEMINI_API_KEY[:10]}...")

# List available models
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={GEMINI_API_KEY}"

try:
    response = requests.get(url)
    
    if response.ok:
        data = response.json()
        models = data.get('models', [])
        
        print(f"\n📋 Found {len(models)} available models:")
        print("=" * 50)
        
        for model in models:
            name = model.get('name', 'Unknown')
            display_name = model.get('displayName', 'Unknown')
            supported_methods = model.get('supportedGenerationMethods', [])
            
            print(f"Name: {name}")
            print(f"Display Name: {display_name}")
            print(f"Supported Methods: {', '.join(supported_methods)}")
            print("-" * 30)
            
        # Test the first available model that supports generateContent
        print("\n🧪 Testing first available model...")
        for model in models:
            if 'generateContent' in model.get('supportedGenerationMethods', []):
                model_name = model.get('name')
                print(f"Testing: {model_name}")
                
                test_url = f"https://generativelanguage.googleapis.com/v1beta/{model_name}:generateContent?key={GEMINI_API_KEY}"
                
                payload = {
                    "contents": [{
                        "parts": [{
                            "text": "Hello, test message"
                        }]
                    }]
                }
                
                test_response = requests.post(test_url, json=payload, headers={"Content-Type": "application/json"})
                
                if test_response.ok:
                    test_data = test_response.json()
                    generated_text = test_data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
                    print(f"✅ SUCCESS with {model_name}: {generated_text[:50]}...")
                    break
                else:
                    print(f"❌ Failed with {model_name}: {test_response.status_code}")
                    
    else:
        print(f"❌ Failed to list models: {response.status_code} - {response.text}")

except Exception as e:
    print(f"❌ Error: {e}")

print("\n✅ Model listing complete!")