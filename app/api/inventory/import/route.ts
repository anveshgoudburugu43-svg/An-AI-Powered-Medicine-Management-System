import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read file content
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'File is empty or invalid' }, { status: 400 });
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Required headers
    const requiredHeaders = ['name', 'dosage', 'manufacturer', 'quantity', 'selling_price'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      return NextResponse.json({ 
        error: `Missing required columns: ${missingHeaders.join(', ')}`,
        required: requiredHeaders,
        found: headers
      }, { status: 400 });
    }

    // Parse data rows
    const medicines = [];
    const inventory = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // Validate required fields
        if (!row.name || !row.quantity || !row.selling_price) {
          errors.push(`Row ${i + 1}: Missing required fields`);
          continue;
        }

        // Create medicine record
        const { data: medicine, error: medError } = await supabase
          .from('medicines')
          .insert({
            user_id: user.id,
            name: row.name,
            dosage: row.dosage || '-',
            manufacturer: row.manufacturer || '-',
            expiry_date: row.expiry_date || null,
            quantity: parseInt(row.quantity) || 0,
            description: row.description || '-',
            status: 'active'
          })
          .select()
          .single();

        if (medError) {
          errors.push(`Row ${i + 1}: ${medError.message}`);
          continue;
        }

        medicines.push(medicine);

        // Create inventory record if we have pricing info
        if (medicine && row.selling_price) {
          const { error: invError } = await supabase
            .from('inventory')
            .insert({
              medicine_id: medicine.id,
              selling_price: parseFloat(row.selling_price) || 0,
              purchase_price: parseFloat(row.purchase_price) || 0,
              quantity_in_stock: parseInt(row.quantity) || 0,
              minimum_stock_level: parseInt(row.minimum_stock_level) || 10,
              maximum_stock_level: parseInt(row.maximum_stock_level) || 100
            });

          if (!invError) {
            inventory.push({ medicine_id: medicine.id });
          }
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Row ${i + 1}: ${errorMessage}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported: medicines.length,
      inventory_created: inventory.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully imported ${medicines.length} medicines`
    });

  } catch (error) {
    console.error('Error importing inventory:', error);
    return NextResponse.json({ error: 'Failed to import inventory' }, { status: 500 });
  }
}