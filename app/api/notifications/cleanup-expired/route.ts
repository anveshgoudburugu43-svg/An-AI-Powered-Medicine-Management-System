import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    await requireAuth(['Manager', 'Pharmacist', 'User']);
    
    // Get all expired medicines
    const { data: expiredMedicines, error: medicineError } = await supabase
      .from('medicines')
      .select('id')
      .lt('expiry_date', new Date().toISOString().split('T')[0]);

    if (medicineError) {
      console.error('Error fetching expired medicines:', medicineError);
      return NextResponse.json({ error: 'Failed to fetch expired medicines' }, { status: 500 });
    }

    if (!expiredMedicines || expiredMedicines.length === 0) {
      return NextResponse.json({ 
        message: 'No expired medicines found',
        removed_count: 0 
      });
    }

    const expiredMedicineIds = expiredMedicines.map(med => med.id);

    // Remove notifications for expired medicines
    const { error: deleteError, count } = await supabase
      .from('notifications')
      .delete()
      .in('medicine_id', expiredMedicineIds)
      .in('type', ['expiry_warning', 'expired', 'stock_expiry']);

    if (deleteError) {
      console.error('Error removing expired medicine notifications:', deleteError);
      return NextResponse.json({ error: 'Failed to remove expired notifications' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Successfully removed notifications for expired medicines',
      removed_count: count || 0,
      expired_medicines_count: expiredMedicines.length
    });

  } catch (error) {
    console.error('Error in cleanup expired notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}