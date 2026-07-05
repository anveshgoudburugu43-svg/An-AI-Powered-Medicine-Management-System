#!/usr/bin/env python3
"""
Test script to verify Gemini REST API works
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

print("🔍 Testing Gemini REST API...")
print(f"API Key: {GEMINI_API_KEY[:10]}...")

# Test with gemini-2.5-flash (the working model we found)
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

payload = {
    "contents": [{
        "parts": [{
            "text": "Hello, this is a test message. Please respond with 'API working!'"
        }]
    }]
}

try:
    print("\n🧪 Testing gemini-2.5-flash...")
    response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
    
    if response.ok:
        data = response.json()
        generated_text = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        print(f"✅ Success: {generated_text}")
    else:
        print(f"❌ Failed: {response.status_code} - {response.text}")
        
        # Try fallback
        print("\n🧪 Testing gemini-flash-latest fallback...")
        url_fallback = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={GEMINI_API_KEY}"
        response = requests.post(url_fallback, json=payload, headers={"Content-Type": "application/json"})
        
        if response.ok:
            data = response.json()
            generated_text = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
            print(f"✅ Fallback Success: {generated_text}")
        else:
            print(f"❌ Fallback Failed: {response.status_code} - {response.text}")

except Exception as e:
    print(f"❌ Error: {e}")

print("\n✅ Test complete!")