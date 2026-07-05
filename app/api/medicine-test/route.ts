import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'Medicine test route works!',
    timestamp: new Date().toISOString()
  });
}

export async function POST() {
  return NextResponse.json({ 
    message: 'Medicine POST test route works!',
    timestamp: new Date().toISOString()
  });
}