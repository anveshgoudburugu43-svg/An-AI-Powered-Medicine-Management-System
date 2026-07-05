import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { supabase } from '@/lib/supabase';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: medicineId } = await params;

    if (!medicineId) {
      return NextResponse.json({ error: 'Medicine ID required' }, { status: 400 });
    }

    // Delete medicine (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('medicines')
      .delete()
      .eq('id', medicineId);

    if (deleteError) {
      console.error('Error deleting medicine:', deleteError);
      return NextResponse.json({ error: 'Failed to delete medicine' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Medicine deleted successfully' 
    });

  } catch (error) {
    console.error('Error in DELETE /api/medicine/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
