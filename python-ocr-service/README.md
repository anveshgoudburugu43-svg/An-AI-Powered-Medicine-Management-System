# Medicine OCR Service

A Python service using EasyOCR and Google Generative AI to extract and interpret text from medicine package images.

## Setup

1. **Install Python dependencies:**
   ```bash
   cd python-ocr-service
   pip install -r requirements.txt
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

3. **Run the service:**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

4. **Test the service:**
   ```bash
   curl http://localhost:8000/health
   curl http://localhost:8000/test-gemini
   ```

## API Endpoints

- `POST /ocr` - Extract text from base64 encoded image with AI interpretation
- `POST /ocr/file` - Extract text from uploaded file with AI interpretation
- `GET /health` - Health check with configuration status
- `GET /test-gemini` - Test Gemini AI integration

## Features

- **EasyOCR Integration**: High-accuracy text extraction
- **Google Generative AI**: Intelligent interpretation of medicine information
- **Multi-language Support**: English and Hindi text recognition
- **Structured Output**: Returns both raw OCR text and structured medicine data
- **Confidence Scoring**: Provides accuracy metrics for extracted text
- **CORS Enabled**: Ready for Next.js integration

## Environment Variables

- `GEMINI_API_KEY`: Your Google Generative AI API key (required for AI interpretation)

## Response Format

```json
{
  "success": true,
  "text": "Raw OCR extracted text",
  "confidence": 0.85,
  "interpretation": {
    "medicine_name": "Paracetamol",
    "dosage": "500mg",
    "manufacturer": "ABC Pharma Ltd",
    "batch_number": "PAR123456",
    "expiry_date": "2025-12-31",
    "supplier": "MediCorp Distributors",
    "price": 45.50,
    "info": "Pain reliever and fever reducer",
    "confidence": 0.85
  }
}
```

## Usage

The service will automatically:
1. Download EasyOCR models on first run
2. Extract text from uploaded images
3. Use Gemini AI to interpret and structure the text
4. Return both raw OCR text and structured medicine information

Perfect for integration with pharmacy management systems!