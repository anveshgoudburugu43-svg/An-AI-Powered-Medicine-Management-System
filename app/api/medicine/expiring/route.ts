import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(['Manager', 'Pharmacist']); // Only managers and pharmacists can see all expiring medicines
    
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '14'); // Default to 2 weeks
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    // Get medicines expiring within the specified timeframe (future dates only)
    const { data: medicines, error } = await supabase
      .from('medicines')
      .select('id, name, expiry_date, quantity, dosage, manufacturer')
      .gte('expiry_date', new Date().toISOString()) // Only future dates (not expired)
      .lte('expiry_date', futureDate.toISOString()) // Within the timeframe
      .gt('quantity', 0) // Has stock
      .order('expiry_date', { ascending: true });

    if (error) {
      console.error('Error fetching expiring medicines:', error);
      return NextResponse.json({ error: 'Failed to fetch expiring medicines' }, { status: 500 });
    }

    return NextResponse.json(medicines || []);
  } catch (error) {
    console.error('Error in GET /api/medicine/expiring:', error);
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}