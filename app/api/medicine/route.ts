import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { supabase } from '@/lib/supabase';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  console.log('=== GET /api/medicine called ===');
  try {
    const session = await getServerSession(authOptions);
    console.log('Session in medicine route:', !!session);
    
    if (!session?.user?.email) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User email:', session.user.email);

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (userError) {
      console.error('User fetch error:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('User found:', user.id);

    // Get medicines for the user (temporarily get all medicines for debugging)
    const { data: medicines, error } = await supabase
      .from('medicines')
      .select('*')
      .order('expiry_date', { ascending: true });

    if (error) {
      console.error('Error fetching medicines:', error);
      return NextResponse.json({ error: 'Failed to fetch medicines' }, { status: 500 });
    }

    console.log('Medicines found:', medicines?.length || 0);
    console.log('Sample medicine:', medicines?.[0]);
    return NextResponse.json(medicines || []);
  } catch (error) {
    console.error('Error in GET /api/medicine:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('=== POST /api/medicine called ===');
  try {
    const session = await getServerSession(authOptions);
    console.log('Session in medicine POST:', !!session);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (userError) {
      console.error('User fetch error:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, dosage, manufacturer, expiry_date, quantity, image_url, status } = body;

    console.log('Creating medicine:', { name, expiry_date, user_id: user.id });

    // Insert medicine
    const { data: medicine, error } = await supabase
      .from('medicines')
      .insert({
        user_id: user.id,
        name,
        description,
        dosage,
        manufacturer,
        expiry_date,
        quantity: quantity || 1,
        image_url,
        status: status || 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating medicine:', error);
      return NextResponse.json({ error: 'Failed to create medicine' }, { status: 500 });
    }

    console.log('Medicine created:', medicine.id);
    return NextResponse.json(medicine);
  } catch (error) {
    console.error('Error in POST /api/medicine:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}