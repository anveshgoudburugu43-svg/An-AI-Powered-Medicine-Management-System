import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  console.log('=== GET /api/sales called ===');
  try {
    const user = await requireAuth(); // Allow all authenticated users for now
    console.log('User authenticated:', user.email);
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    
    let query = supabase
      .from('sales')
      .select(`
        *,
        sale_items (*)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: sales, error, count } = await query;

    if (error) {
      console.error('Error fetching sales:', error);
      return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
    }

    console.log('Sales found:', sales?.length || 0);

    // Enrich sales with medicine data
    const enrichedSales = await Promise.all(
      (sales || []).map(async (sale: any) => {
        const enrichedItems = await Promise.all(
          (sale.sale_items || []).map(async (item: any) => {
            // Fetch medicine data for each item
            const { data: medicine } = await supabase
              .from('medicines')
              .select('id, name, dosage, manufacturer')
              .eq('id', item.medicine_id)
              .single();

            return {
              ...item,
              medicine: medicine || { 
                id: item.medicine_id, 
                name: 'Unknown Medicine', 
                dosage: 'Unknown', 
                manufacturer: 'Unknown' 
              }
            };
          })
        );

        return {
          ...sale,
          sale_items: enrichedItems
        };
      })
    );

    return NextResponse.json({
      sales: enrichedSales,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error in GET /api/sales:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(); // Allow all authenticated users for now
    
    const body = await request.json();
    const {
      customer_name,
      customer_phone,
      customer_email,
      items, // Array of { medicine_id, quantity, unit_price }
      discount_amount = 0,
      tax_amount = 0,
      payment_method = 'cash'
    } = body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items are required' }, { status: 400 });
    }

    // Calculate totals
    let total_amount = 0;
    const validatedItems = [];

    for (const item of items) {
      const { medicine_id, quantity, unit_price } = item;
      
      if (!medicine_id || !quantity || !unit_price) {
        return NextResponse.json({ error: 'Invalid item data' }, { status: 400 });
      }

      // Check if medicine exists and has enough stock
      // First check inventory table, then fall back to medicines table
      const { data: inventory } = await supabase
        .from('inventory')
        .select('quantity_in_stock')
        .eq('medicine_id', medicine_id)
        .single();

      const { data: medicine, error: medError } = await supabase
        .from('medicines')
        .select('id, name, quantity')
        .eq('id', medicine_id)
        .single();

      if (medError || !medicine) {
        return NextResponse.json({ error: `Medicine not found: ${medicine_id}` }, { status: 400 });
      }

      // Use inventory stock if available, otherwise use medicine stock
      const availableStock = inventory?.quantity_in_stock ?? medicine.quantity ?? 0;
      
      if (availableStock < quantity) {
        return NextResponse.json({ 
          error: `Insufficient stock for medicine: ${medicine.name}. Available: ${availableStock}, Requested: ${quantity}` 
        }, { status: 400 });
      }

      const total_price = quantity * unit_price;
      total_amount += total_price;
      
      validatedItems.push({
        medicine_id,
        quantity,
        unit_price,
        total_price
      });
    }

    const final_amount = total_amount - discount_amount + tax_amount;

    // Create sale transaction
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        user_id: user.id,
        customer_name,
        customer_phone,
        customer_email,
        total_amount,
        discount_amount,
        tax_amount,
        final_amount,
        payment_method
      })
      .select()
      .single();

    if (saleError) {
      console.error('Error creating sale:', saleError);
      return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 });
    }

    // Create sale items and update inventory
    for (const item of validatedItems) {
      // Create sale item
      const { error: itemError } = await supabase
        .from('sale_items')
        .insert({
          sale_id: sale.id,
          ...item
        });

      if (itemError) {
        console.error('Error creating sale item:', itemError);
        // TODO: Rollback sale if needed
        continue;
      }

      // Update stock in both inventory and medicines tables
      // First update inventory if record exists
      const { data: currentInventory } = await supabase
        .from('inventory')
        .select('quantity_in_stock')
        .eq('medicine_id', item.medicine_id)
        .single();

      if (currentInventory) {
        const newInventoryQuantity = Math.max(0, (currentInventory.quantity_in_stock || 0) - item.quantity);
        await supabase
          .from('inventory')
          .update({ quantity_in_stock: newInventoryQuantity })
          .eq('medicine_id', item.medicine_id);
      }

      // Also update medicines table for consistency
      const { data: currentMedicine } = await supabase
        .from('medicines')
        .select('quantity')
        .eq('id', item.medicine_id)
        .single();

      if (currentMedicine) {
        const newMedicineQuantity = Math.max(0, (currentMedicine.quantity || 0) - item.quantity);
        await supabase
          .from('medicines')
          .update({ quantity: newMedicineQuantity })
          .eq('id', item.medicine_id);
      }

      // Create stock movement record
      await supabase
        .from('stock_movements')
        .insert({
          medicine_id: item.medicine_id,
          movement_type: 'sale',
          quantity_change: -item.quantity,
          reference_id: sale.id,
          created_by: user.id,
          notes: `Sale to ${customer_name || 'Customer'}`
        });
    }

    // Fetch the complete sale with sale_items for the response
    const { data: completeSale, error: fetchError } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          *,
          medicines (name, dosage)
        )
      `)
      .eq('id', sale.id)
      .single();

    if (fetchError) {
      console.error('Error fetching complete sale:', fetchError);
      return NextResponse.json(sale); // Return basic sale if fetch fails
    }

    return NextResponse.json(completeSale);
  } catch (error) {
    console.error('Error in POST /api/sales:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}