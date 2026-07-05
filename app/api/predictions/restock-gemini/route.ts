import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(['Manager', 'Pharmacist']);
    
    // Get all medicines with current stock and recent prescription data
    const { data: medicines, error: medError } = await supabase
      .from('medicines')
      .select(`
        *,
        inventory (
          quantity_in_stock,
          minimum_stock_level,
          selling_price
        ),
        prescriptions (
          quantity,
          days_supply,
          status,
          prescribed_date,
          filled_date
        )
      `);

    if (medError) {
      console.error('Error fetching medicines:', medError);
      return NextResponse.json({ error: 'Failed to fetch medicines data' }, { status: 500 });
    }

    // Prepare data for Gemini analysis
    const medicineAnalysisData = medicines?.map(med => ({
      name: med.name,
      generic_name: med.generic_name,
      ndc_code: med.ndc_code,
      current_stock: med.inventory?.[0]?.quantity_in_stock || 0,
      minimum_level: med.inventory?.[0]?.minimum_stock_level || 10,
      selling_price: med.inventory?.[0]?.selling_price || 0,
      recent_prescriptions: med.prescriptions?.filter((p: any) => {
        const prescribedDate = new Date(p.prescribed_date);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return prescribedDate > thirtyDaysAgo;
      }).length || 0,
      total_prescribed_quantity: med.prescriptions?.reduce((sum: number, p: any) => 
        sum + (parseInt(p.quantity) || 0), 0) || 0,
      filled_prescriptions: med.prescriptions?.filter((p: any) => 
        p.status === 'filled' || p.status === 'picked up').length || 0
    })) || [];

    // Create prompt for Gemini
    const prompt = `
You are a pharmacy inventory management AI. Analyze the following medicine data and provide restock recommendations.

MEDICINE DATA:
${JSON.stringify(medicineAnalysisData, null, 2)}

For each medicine, consider:
1. Current stock vs minimum level
2. Recent prescription trends (last 30 days)
3. Seasonal patterns (if applicable)
4. Medicine type and usage patterns

Provide recommendations in this JSON format:
{
  "recommendations": [
    {
      "medicine_name": "Medicine Name",
      "ndc_code": "12345",
      "current_stock": 15,
      "suggested_reorder": 100,
      "urgency": "high|medium|low|critical",
      "reasoning": "Detailed explanation of why this quantity is recommended",
      "confidence": 0.85
    }
  ],
  "summary": "Overall analysis summary"
}

Focus on medicines that are:
- Below minimum stock levels
- Have high prescription demand
- Show increasing usage trends
- Are critical for patient care

Provide practical, actionable recommendations.
`;

    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    const text = result.text || '';

    // Parse Gemini response
    let geminiRecommendations;
    try {
      // Extract JSON from response (Gemini sometimes adds extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        geminiRecommendations = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      return NextResponse.json({ 
        error: 'Failed to parse AI recommendations',
        raw_response: text 
      }, { status: 500 });
    }

    // Save recommendations to database
    const restockSuggestions = [];
    for (const rec of geminiRecommendations.recommendations || []) {
      const medicine = medicines?.find(m => 
        m.ndc_code === rec.ndc_code || m.name === rec.medicine_name
      );
      
      if (medicine) {
        restockSuggestions.push({
          medicine_id: medicine.id,
          current_stock: rec.current_stock,
          predicted_usage_30_days: Math.floor(rec.suggested_reorder / 3), // Estimate
          suggested_reorder_quantity: rec.suggested_reorder,
          urgency_level: rec.urgency,
          reasoning: rec.reasoning,
          confidence_score: rec.confidence
        });
      }
    }

    if (restockSuggestions.length > 0) {
      // Clear old suggestions
      await supabase.from('restock_suggestions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Insert new suggestions
      const { error: insertError } = await supabase
        .from('restock_suggestions')
        .insert(restockSuggestions);

      if (insertError) {
        console.error('Error saving restock suggestions:', insertError);
      }
    }

    return NextResponse.json({
      recommendations: geminiRecommendations.recommendations || [],
      summary: geminiRecommendations.summary || 'No summary provided',
      total_medicines_analyzed: medicineAnalysisData.length,
      suggestions_generated: restockSuggestions.length
    });

  } catch (error) {
    console.error('Error in restock prediction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}