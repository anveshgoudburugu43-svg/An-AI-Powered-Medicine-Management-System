#!/usr/bin/env python3
"""
Enhanced OCR service using EasyOCR and Google Generative AI REST API
Install dependencies: pip install fastapi uvicorn easyocr pillow python-multipart requests python-dotenv
Run with: uvicorn main:app --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import easyocr
import base64
import io
import os
import requests
from PIL import Image
import numpy as np
from pydantic import BaseModel
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="Medicine OCR Service", version="1.0.0")

# Enable CORS for Next.js app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize EasyOCR reader (supports English and Hindi)
reader = easyocr.Reader(['en', 'hi'])

# Configure Google Generative AI
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
print(f"GEMINI_API_KEY loaded: {'Yes' if GEMINI_API_KEY else 'No'}")
if GEMINI_API_KEY:
    print(f"API Key (first 10 chars): {GEMINI_API_KEY[:10]}...")
    print("✅ Gemini API key configured successfully")
else:
    print("⚠️  Warning: GEMINI_API_KEY not found. AI interpretation will be disabled.")

class ImageData(BaseModel):
    image: str  # base64 encoded image

class OCRResponse(BaseModel):
    success: bool
    text: str
    confidence: float
    interpretation: dict = None

def interpret_with_gemini(ocr_text: str) -> dict:
    """Use Gemini AI REST API to interpret OCR text and extract medicine information"""
    if not GEMINI_API_KEY:
        return {
            "medicine_name": None,
            "dosage": None,
            "manufacturer": None,
            "batch_number": None,
            "expiry_date": None,
            "supplier": None,
            "price": None,
            "info": "AI interpretation unavailable - GEMINI_API_KEY not configured",
            "confidence": 0.0
        }
    
    try:
        prompt = f"""
        You are a medical inventory assistant. Analyze the following OCR text from a medicine package/label and extract structured information.

        OCR Text: "{ocr_text}"

        Please extract and return ONLY a valid JSON object with the following fields (use null if information is not available):
        {{
          "medicine_name": "extracted medicine name",
          "dosage": "extracted dosage (e.g., 500mg, 10ml)",
          "manufacturer": "manufacturer name",
          "batch_number": "batch number if available",
          "expiry_date": "expiry date in YYYY-MM-DD format if available",
          "supplier": "supplier/distributor name if mentioned",
          "price": "price as number (extract numeric value only)",
          "info": "any additional relevant information about the medicine",
          "confidence": "your confidence level (0-1) in the extraction accuracy"
        }}

        Return only the JSON object, no additional text or explanation.
        """
        
        # Try different model names based on available models
        model_endpoints = [
            "models/gemini-2.5-flash:generateContent",
            "models/gemini-flash-latest:generateContent",
            "models/gemini-pro-latest:generateContent", 
            "models/gemini-2.5-pro:generateContent"
        ]
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }],
            "generationConfig": {
                "temperature": 0.1,
                "topK": 1,
                "topP": 1,
                "maxOutputTokens": 1024,
            }
        }
        
        for endpoint in model_endpoints:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/{endpoint}?key={GEMINI_API_KEY}"
                response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
                
                if response.ok:
                    data = response.json()
                    generated_text = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
                    
                    if not generated_text:
                        continue
                    
                    # Clean the response and extract JSON
                    cleaned_text = generated_text.replace('```json\n', '').replace('```\n', '').replace('```', '').strip()
                    
                    # Try to parse as JSON
                    try:
                        return json.loads(cleaned_text)
                    except json.JSONDecodeError:
                        # If direct parsing fails, try to extract JSON from the text
                        import re
                        json_match = re.search(r'\{[\s\S]*\}', cleaned_text)
                        if json_match:
                            return json.loads(json_match.group())
                        else:
                            continue
                else:
                    error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                    error_message = error_data.get('error', {}).get('message', response.text)
                    
                    # Check for quota exceeded
                    if response.status_code == 429:
                        print(f"Quota exceeded for {endpoint}: {error_message}")
                        continue  # Try next model
                    else:
                        print(f"Model {endpoint} failed: {response.status_code} - {error_message[:100]}")
                        continue
                    
            except Exception as model_error:
                print(f"Model {endpoint} error: {model_error}")
                continue
        
        raise Exception("No working model found")
                
    except Exception as e:
        error_message = str(e)
        print(f"Gemini interpretation error: {e}")
        
        # Check if it's a quota issue
        if "quota" in error_message.lower() or "429" in error_message:
            info_message = "AI quota exceeded. Please wait or upgrade your Gemini API plan. OCR text extraction still works."
        else:
            info_message = f"AI interpretation failed: {error_message}"
        
        return {
            "medicine_name": None,
            "dosage": None,
            "manufacturer": None,
            "batch_number": None,
            "expiry_date": None,
            "supplier": None,
            "price": None,
            "info": info_message,
            "confidence": 0.0
        }

@app.post("/ocr", response_model=OCRResponse)
async def extract_text_from_image(data: ImageData):
    try:
        # Decode base64 image
        image_data = base64.b64decode(data.image)
        image = Image.open(io.BytesIO(image_data))
        
        # Convert PIL image to numpy array
        image_np = np.array(image)
        
        # Perform OCR
        results = reader.readtext(image_np)
        
        # Extract text from results
        extracted_text = []
        confidences = []
        
        for (bbox, text, confidence) in results:
            if confidence > 0.5:  # Only include text with good confidence
                extracted_text.append(text)
                confidences.append(confidence)
        
        # Join all text with newlines
        full_text = '\n'.join(extracted_text)
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0
        
        # Get AI interpretation
        interpretation = interpret_with_gemini(full_text)
        
        return OCRResponse(
            success=True,
            text=full_text,
            confidence=avg_confidence,
            interpretation=interpretation
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

@app.post("/ocr/file", response_model=OCRResponse)
async def extract_text_from_file(file: UploadFile = File(...)):
    try:
        # Read uploaded file
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Convert PIL image to numpy array
        image_np = np.array(image)
        
        # Perform OCR
        results = reader.readtext(image_np)
        
        # Extract text from results
        extracted_text = []
        confidences = []
        
        for (bbox, text, confidence) in results:
            if confidence > 0.5:  # Only include text with good confidence
                extracted_text.append(text)
                confidences.append(confidence)
        
        # Join all text with newlines
        full_text = '\n'.join(extracted_text)
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0
        
        # Get AI interpretation
        interpretation = interpret_with_gemini(full_text)
        
        return OCRResponse(
            success=True,
            text=full_text,
            confidence=avg_confidence,
            interpretation=interpretation
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "service": "Medicine OCR Service",
        "gemini_configured": GEMINI_API_KEY is not None,
        "gemini_api_key_length": len(GEMINI_API_KEY) if GEMINI_API_KEY else 0,
        "ocr_languages": ['en', 'hi'],
        "api_method": "REST API"
    }

@app.get("/test-gemini")
async def test_gemini():
    """Test endpoint to verify Gemini AI integration"""
    if not GEMINI_API_KEY:
        return {"error": "Gemini AI not configured - GEMINI_API_KEY missing"}
    
    try:
        # Try different model endpoints based on available models
        model_endpoints = [
            "models/gemini-2.5-flash:generateContent",
            "models/gemini-flash-latest:generateContent",
            "models/gemini-pro-latest:generateContent", 
            "models/gemini-2.5-pro:generateContent"
        ]
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": "Explain how AI works in a few words"
                }]
            }]
        }
        
        for endpoint in model_endpoints:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/{endpoint}?key={GEMINI_API_KEY}"
                response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
                
                if response.ok:
                    data = response.json()
                    generated_text = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
                    
                    return {
                        "success": True,
                        "response": generated_text,
                        "model": endpoint,
                        "method": "REST API"
                    }
                else:
                    print(f"Model {endpoint} failed: {response.status_code}")
                    continue
                    
            except Exception as model_error:
                print(f"Model {endpoint} error: {model_error}")
                continue
        
        return {
            "success": False,
            "error": "No working model found"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)