import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/lib/supabase';

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!
});

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get current medicines/inventory data
    const { data: medicines, error: medError } = await supabase
      .from('medicines')
      .select(`
        *,
        inventory (
          quantity_in_stock,
          minimum_stock_level,
          maximum_stock_level,
          selling_price,
          purchase_price,
          supplier_name
        )
      `);

    if (medError) {
      console.error('Error fetching medicines:', medError);
    }

    // Prepare inventory context for the AI
    const inventoryContext = medicines?.map(med => ({
      name: med.name,
      generic_name: med.generic_name,
      brand_name: med.brand_name,
      ndc_code: med.ndc_code,
      dosage: med.dosage,
      manufacturer: med.manufacturer,
      expiry_date: med.expiry_date,
      status: med.status,
      current_stock: med.inventory?.[0]?.quantity_in_stock || 0,
      minimum_level: med.inventory?.[0]?.minimum_stock_level || 0,
      selling_price: med.inventory?.[0]?.selling_price || 0,
      supplier: med.inventory?.[0]?.supplier_name || 'Unknown'
    })) || [];

    const prompt = `You are a specialized pharmacy and medical assistant chatbot with access to real-time inventory data. Your role is STRICTLY LIMITED to answering questions about:
- Medications, prescriptions, and drug interactions
- Medical conditions, diseases, and symptoms
- Health and wellness topics
- Pharmacy services and medication management
- General healthcare advice
- INVENTORY QUERIES about medicines in stock

CURRENT PHARMACY INVENTORY:
${JSON.stringify(inventoryContext, null, 2)}

IMPORTANT RULES:
1. If the user asks about topics NOT related to pharmacy, medicine, health, wellness, or inventory (such as sports, entertainment, politics, technology, etc.), you MUST politely decline and redirect them to medical/pharmacy topics.
2. For inventory questions, use the provided inventory data to give accurate stock information.
3. Always remind users to consult with healthcare professionals for serious concerns or diagnosis.
4. Keep responses concise, informative, and professional.
5. Never provide specific medical diagnoses or prescribe medications.
6. For stock queries, provide current quantities, expiry dates, and availability status.
7. Include relevant medical disclaimers when discussing medications.

User question: ${message}

If this question is not related to pharmacy, medicine, health topics, or inventory queries, respond with: "I apologize, but I can only assist with pharmacy, medical, health-related questions, and inventory queries. Please ask me about medications, health conditions, symptoms, wellness topics, or check our current stock levels. How can I help you with your health or inventory needs today?"`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    const text = response.text || 'I apologize, but I couldn\'t generate a response. Please try again.';

    return NextResponse.json({ 
      response: text,
      inventory_count: inventoryContext.length 
    });

  } catch (error) {
    console.error('Error in chatbot API:', error);
    return NextResponse.json({ 
      error: 'I apologize, but I\'m having trouble connecting right now. Please try again later or consult with a healthcare professional for immediate concerns.' 
    }, { status: 500 });
  }
}