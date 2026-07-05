import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function GET(request: NextRequest) {
  try {
    await requireAuth(['Manager', 'Pharmacist', 'User']);
    
    // If we have stored suggestions, return them
    const { data: storedSuggestions } = await supabase
      .from('restock_suggestions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (storedSuggestions && storedSuggestions.length > 0) {
      // Enrich with medicine data
      const enrichedSuggestions = await Promise.all(
        storedSuggestions.map(async (suggestion: any) => {
          const { data: medicine } = await supabase
            .from('medicines')
            .select('name, generic_name, ndc_code, brand_name')
            .eq('id', suggestion.medicine_id)
            .single();

          return {
            medicine_name: medicine?.name || 'Unknown',
            ndc_code: medicine?.ndc_code || '',
            current_stock: suggestion.current_stock,
            suggested_reorder: suggestion.suggested_reorder_quantity,
            urgency: suggestion.urgency_level,
            reasoning: suggestion.reasoning,
            confidence: suggestion.confidence_score,
            created_at: suggestion.created_at
          };
        })
      );

      return NextResponse.json({
        recommendations: enrichedSuggestions,
        total_count: enrichedSuggestions.length,
        source: 'stored'
      });
    }

    // If no stored suggestions or they're old, generate new ones with Gemini
    return await generateIntelligentSuggestions();

  } catch (error) {
    console.error('Error in restock suggestions API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(['Manager', 'Pharmacist']);
    
    // Force regenerate suggestions
    return await generateIntelligentSuggestions();
    
  } catch (error) {
    console.error('Error generating new suggestions:', error);
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
  }
}

async function generateIntelligentSuggestions() {
  if (!GEMINI_API_KEY) {
    // Fallback to basic logic if no Gemini API
    return generateBasicSuggestions();
  }

  try {
    // Fetch current data
    const [medicinesRes, salesRes, inventoryRes] = await Promise.all([
      supabase.from('medicines').select('*').order('quantity', { ascending: true }),
      supabase.from('sales').select('*, sale_items(*)').order('created_at', { ascending: false }).limit(30),
      supabase.from('inventory').select('*')
    ]);

    const medicines = medicinesRes.data || [];
    const sales = salesRes.data || [];
    const inventory = inventoryRes.data || [];

    // Create intelligent prompt for Gemini
    const prompt = `
You are a pharmacy inventory AI. Analyze this data and provide restock recommendations.

CURRENT MEDICINES (showing low stock first):
${medicines.slice(0, 15).map(med => {
  const stock = med.quantity || 0;
  const daysUntilExpiry = med.expiry_date ? Math.ceil((new Date(med.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 'unknown';
  return `- ${med.name} (${med.dosage || 'unknown dosage'}): ${stock} units, expires in ${daysUntilExpiry} days`;
}).join('\n')}

RECENT SALES PATTERN:
${sales.slice(0, 10).map(sale => {
  const itemCount = sale.sale_items?.length || 0;
  const date = new Date(sale.created_at).toLocaleDateString();
  return `- ${date}: ${itemCount} items sold, total: ₹${sale.final_amount}`;
}).join('\n')}

INVENTORY DATA:
${inventory.slice(0, 10).map(inv => `- Medicine ID ${inv.medicine_id}: ${inv.quantity_in_stock || 0} in stock, selling at ₹${inv.selling_price || 0}`).join('\n')}

Return ONLY a JSON array of recommendations in this exact format:
[
  {
    "medicine_name": "exact medicine name",
    "current_stock": 5,
    "suggested_reorder": 50,
    "urgency": "high",
    "reasoning": "Low stock with high sales velocity",
    "confidence": 0.85,
    "estimated_cost": 2500,
    "priority_score": 9
  }
]

Focus on:
1. Medicines with stock < 10 units
2. High-selling medicines from sales data
3. Medicines approaching expiry that need quick turnover
4. Cost-effective reorder quantities

Return maximum 10 recommendations, prioritized by urgency.
`;

    const geminiResponse = await callGemini(prompt);
    
    if (geminiResponse && Array.isArray(geminiResponse)) {
      // Store suggestions in database for future use
      await storeSuggestions(geminiResponse, medicines);
      
      return NextResponse.json({
        recommendations: geminiResponse,
        total_count: geminiResponse.length,
        source: 'ai_generated',
        generated_at: new Date().toISOString()
      });
    } else {
      // Fallback if Gemini response is invalid
      return generateBasicSuggestions();
    }

  } catch (error) {
    console.error('Error with Gemini generation:', error);
    return generateBasicSuggestions();
  }
}

async function generateBasicSuggestions() {
  // Basic fallback logic
  const { data: medicines } = await supabase
    .from('medicines')
    .select('*')
    .lt('quantity', 10)
    .order('quantity', { ascending: true })
    .limit(10);

  const recommendations = (medicines || []).map(med => ({
    medicine_name: med.name,
    current_stock: med.quantity || 0,
    suggested_reorder: Math.max(50, (med.quantity || 0) * 5),
    urgency: (med.quantity || 0) < 5 ? 'high' : 'medium',
    reasoning: `Low stock: ${med.quantity || 0} units remaining`,
    confidence: 0.7,
    estimated_cost: null,
    priority_score: 10 - (med.quantity || 0)
  }));

  return NextResponse.json({
    recommendations,
    total_count: recommendations.length,
    source: 'basic_logic'
  });
}

async function callGemini(prompt: string) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.2,
          topK: 1,
          topP: 1,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.log('Gemini API rate limit reached. Using fallback logic.');
        throw new Error('RATE_LIMIT');
      }
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean and parse JSON
    const cleanedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanedText);

  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMIT') {
      console.log('Rate limit handled gracefully');
    } else {
      console.error('Gemini API call failed:', error);
    }
    throw error;
  }
}

async function storeSuggestions(suggestions: any[], medicines: any[]) {
  try {
    // Clear old suggestions
    await supabase.from('restock_suggestions').delete().lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // Store new suggestions
    const suggestionRecords = suggestions.map(suggestion => {
      const medicine = medicines.find(med => med.name === suggestion.medicine_name);
      return {
        medicine_id: medicine?.id || null,
        current_stock: suggestion.current_stock,
        suggested_reorder_quantity: suggestion.suggested_reorder,
        urgency_level: suggestion.urgency,
        reasoning: suggestion.reasoning,
        confidence_score: suggestion.confidence,
        estimated_cost: suggestion.estimated_cost,
        priority_score: suggestion.priority_score
      };
    }).filter(record => record.medicine_id); // Only store if we found the medicine

    if (suggestionRecords.length > 0) {
      await supabase.from('restock_suggestions').insert(suggestionRecords);
    }
  } catch (error) {
    console.error('Error storing suggestions:', error);
  }
}