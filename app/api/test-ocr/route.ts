import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test if Python OCR service is running
    const response = await fetch('http://localhost:8000/health');
    
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        success: true,
        message: 'OCR service is running',
        service: data
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'OCR service is not responding',
        status: response.status
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'OCR service is not available',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Test Gemini API
    const prompt = "Test prompt for medicine OCR system";
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + process.env.GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      }),
    });

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Gemini API is working',
        status: response.status
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Gemini API error',
        status: response.status
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Gemini API is not available',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}