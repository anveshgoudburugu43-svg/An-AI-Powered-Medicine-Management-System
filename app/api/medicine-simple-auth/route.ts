import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  console.log('=== GET /api/medicine-simple-auth called ===');
  try {
    const session = await getServerSession(authOptions);
    console.log('Session exists:', !!session);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ 
      message: 'Medicine route with auth works!',
      user: session.user.email,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in medicine-simple-auth:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  console.log('=== POST /api/medicine-simple-auth called ===');
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ 
      message: 'Medicine POST with auth works!',
      user: session.user.email,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in medicine-simple-auth POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}