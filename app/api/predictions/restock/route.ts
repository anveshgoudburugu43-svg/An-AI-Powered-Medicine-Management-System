import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface SalesData {
  medicine_id: string;
  total_sold: number;
  avg_daily_sales: number;
  days_active: number;
}

interface InventoryData {
  medicine_id: string;
  quantity_in_stock: number;
  minimum_stock_level: number;
  maximum_stock_level: number;
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(); // Allow all authenticated users for now
    
    // Redirect to use Gemini AI predictions instead
    return NextResponse.json({ 
      message: 'This endpoint is deprecated. Use /api/restock-suggestions for Gemini AI predictions.',
      redirect: '/api/restock-suggestions',
      recommendations: []
    });
  } catch (error) {
    console.error('Error in GET /api/predictions/restock:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(); // Allow all authenticated users for now
    
    // Redirect to use Gemini AI predictions instead
    return NextResponse.json({ 
      message: 'This endpoint is deprecated. Use /api/predictions/restock-gemini for generating predictions.',
      redirect: '/api/predictions/restock-gemini',
      count: 0,
      predictions: []
    });
  } catch (error) {
    console.error('Error in POST /api/predictions/restock:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// This file is deprecated - use /api/predictions/restock-gemini for Gemini AI predictions
// and /api/restock-suggestions to fetch saved predictions