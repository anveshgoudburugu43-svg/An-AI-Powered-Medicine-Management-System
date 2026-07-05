import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await requireAuth(); // Ensure user is authenticated
    
    // Call the check-expiry endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/notifications/check-expiry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      return NextResponse.json({ 
        success: true, 
        message: 'Notifications created successfully',
        details: result
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to create notifications' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in POST /api/notifications/create-once:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}