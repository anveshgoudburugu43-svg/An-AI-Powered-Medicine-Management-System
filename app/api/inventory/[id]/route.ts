import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: inventoryId } = await params;

    if (!inventoryId) {
      return NextResponse.json({ error: 'Inventory ID required' }, { status: 400 });
    }

    // Get inventory item to find medicine_id
    const { data: inventoryItem, error: fetchError } = await supabase
      .from('inventory')
      .select('medicine_id')
      .eq('id', inventoryId)
      .single();

    if (fetchError || !inventoryItem) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }

    // Delete inventory record
    const { error: deleteError } = await supabase
      .from('inventory')
      .delete()
      .eq('id', inventoryId);

    if (deleteError) {
      console.error('Error deleting inventory:', deleteError);
      return NextResponse.json({ error: 'Failed to delete inventory' }, { status: 500 });
    }

    // Create stock movement record for audit trail
    await supabase
      .from('stock_movements')
      .insert({
        medicine_id: inventoryItem.medicine_id,
        movement_type: 'adjustment',
        quantity_change: 0,
        created_by: user.id,
        notes: 'Inventory record deleted'
      });

    return NextResponse.json({ 
      success: true, 
      message: 'Inventory deleted successfully' 
    });

  } catch (error) {
    console.error('Error in DELETE /api/inventory/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
