import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  console.log('=== GET /api/inventory called ===');
  try {
    const user = await requireAuth(); // Allow all authenticated users for now
    console.log('User authenticated:', user.email);
    
    const { searchParams } = new URL(request.url);
    const lowStock = searchParams.get('lowStock') === 'true' || searchParams.get('low_stock') === 'true';
    const search = searchParams.get('search');
    
    let query = supabase
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: inventory, error } = await query;

    if (error) {
      console.error('Error fetching inventory:', error);
      return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }

    console.log('Inventory found:', inventory?.length || 0);

    // Enrich inventory with medicine data
    const enrichedInventory = await Promise.all(
      (inventory || []).map(async (item: any) => {
        // Fetch medicine data for each inventory item
        const { data: medicine } = await supabase
          .from('medicines')
          .select('id, name, dosage, manufacturer, expiry_date, status')
          .eq('id', item.medicine_id)
          .single();

        return {
          ...item,
          medicines: medicine || { 
            id: item.medicine_id, 
            name: 'Unknown Medicine', 
            dosage: 'Unknown', 
            manufacturer: 'Unknown',
            expiry_date: null,
            status: 'unknown'
          }
        };
      })
    );

    // Filter for low stock items
    if (lowStock) {
      const lowStockItems = enrichedInventory.filter(item => 
        item.quantity_in_stock <= (item.minimum_stock_level || 10)
      );
      
      return NextResponse.json(lowStockItems);
    }

    // Apply search filter if needed
    let filteredInventory = enrichedInventory;
    if (search) {
      filteredInventory = filteredInventory.filter(item => 
        item.medicines?.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.medicines?.manufacturer?.toLowerCase().includes(search.toLowerCase()) ||
        item.batch_number?.toLowerCase().includes(search.toLowerCase())
      );
    }

    return NextResponse.json(filteredInventory);
  } catch (error) {
    console.error('Error in GET /api/inventory:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(); // Allow all authenticated users for now
    
    const body = await request.json();
    const {
      medicine_id,
      batch_number,
      purchase_price,
      selling_price,
      quantity_in_stock,
      minimum_stock_level = 10,
      maximum_stock_level = 100,
      supplier_name,
      purchase_date
    } = body;

    // Validate required fields
    if (!medicine_id || !selling_price || !quantity_in_stock) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if medicine exists
    const { data: medicine, error: medError } = await supabase
      .from('medicines')
      .select('id')
      .eq('id', medicine_id)
      .single();

    if (medError || !medicine) {
      return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
    }

    // Check if inventory record already exists
    const { data: existingInventory } = await supabase
      .from('inventory')
      .select('id')
      .eq('medicine_id', medicine_id)
      .single();

    let inventory;
    if (existingInventory) {
      // Update existing record
      const { data: updatedInventory, error: updateError } = await supabase
        .from('inventory')
        .update({
          batch_number,
          purchase_price,
          selling_price,
          quantity_in_stock,
          minimum_stock_level,
          maximum_stock_level,
          supplier_name,
          purchase_date
        })
        .eq('medicine_id', medicine_id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating inventory:', updateError);
        return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
      }
      inventory = updatedInventory;
    } else {
      // Create new record
      const { data: newInventory, error: insertError } = await supabase
        .from('inventory')
        .insert({
          medicine_id,
          batch_number,
          purchase_price,
          selling_price,
          quantity_in_stock,
          minimum_stock_level,
          maximum_stock_level,
          supplier_name,
          purchase_date
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating inventory:', insertError);
        return NextResponse.json({ error: 'Failed to create inventory' }, { status: 500 });
      }
      inventory = newInventory;
    }

    // Create stock movement record
    await supabase
      .from('stock_movements')
      .insert({
        medicine_id,
        movement_type: 'purchase',
        quantity_change: quantity_in_stock,
        created_by: user.id,
        notes: `Purchase from ${supplier_name || 'Supplier'} - Batch: ${batch_number || 'N/A'}`
      });

    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Error in POST /api/inventory:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}