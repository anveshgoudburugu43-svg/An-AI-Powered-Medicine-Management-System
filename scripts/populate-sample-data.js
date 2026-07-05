const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Sample data
const sampleMedicines = [
  {
    name: 'Paracetamol',
    description: 'Pain reliever and fever reducer',
    dosage: '500mg',
    manufacturer: 'PharmaCorp',
    expiry_date: '2025-12-31',
    quantity: 1,
    status: 'active',
    purchase_price: 2.50,
    selling_price: 5.00,
    barcode: 'PC500001'
  },
  {
    name: 'Ibuprofen',
    description: 'Anti-inflammatory pain reliever',
    dosage: '400mg',
    manufacturer: 'MediLab',
    expiry_date: '2025-11-15',
    quantity: 1,
    status: 'active',
    purchase_price: 3.00,
    selling_price: 6.50,
    barcode: 'ML400001'
  },
  {
    name: 'Amoxicillin',
    description: 'Antibiotic for bacterial infections',
    dosage: '250mg',
    manufacturer: 'BioPharm',
    expiry_date: '2025-08-20',
    quantity: 1,
    status: 'active',
    purchase_price: 8.00,
    selling_price: 15.00,
    barcode: 'BP250001'
  },
  {
    name: 'Aspirin',
    description: 'Blood thinner and pain reliever',
    dosage: '75mg',
    manufacturer: 'CardioMed',
    expiry_date: '2026-03-10',
    quantity: 1,
    status: 'active',
    purchase_price: 1.50,
    selling_price: 3.50,
    barcode: 'CM075001'
  },
  {
    name: 'Omeprazole',
    description: 'Proton pump inhibitor for acid reflux',
    dosage: '20mg',
    manufacturer: 'GastroPharm',
    expiry_date: '2025-06-30',
    quantity: 1,
    status: 'active',
    purchase_price: 4.50,
    selling_price: 9.00,
    barcode: 'GP020001'
  }
];

const sampleInventoryData = [
  { medicine_index: 0, batch_number: 'BATCH2024001', quantity_in_stock: 150, minimum_stock_level: 20, maximum_stock_level: 200, supplier_name: 'MedSupply Co', purchase_date: '2024-01-15' },
  { medicine_index: 1, batch_number: 'BATCH2024002', quantity_in_stock: 8, minimum_stock_level: 15, maximum_stock_level: 100, supplier_name: 'PharmaDist', purchase_date: '2024-02-01' }, // Low stock
  { medicine_index: 2, batch_number: 'BATCH2024003', quantity_in_stock: 75, minimum_stock_level: 10, maximum_stock_level: 80, supplier_name: 'BioSupplies', purchase_date: '2024-01-20' },
  { medicine_index: 3, batch_number: 'BATCH2024004', quantity_in_stock: 200, minimum_stock_level: 25, maximum_stock_level: 150, supplier_name: 'CardioSupply', purchase_date: '2024-03-01' }, // Overstock
  { medicine_index: 4, batch_number: 'BATCH2024005', quantity_in_stock: 45, minimum_stock_level: 12, maximum_stock_level: 80, supplier_name: 'GastroMed Supply', purchase_date: '2024-02-15' }
];

const sampleCustomers = [
  { name: 'John Smith', phone: '+1-555-0101', email: 'john.smith@email.com' },
  { name: 'Sarah Johnson', phone: '+1-555-0102', email: 'sarah.j@email.com' },
  { name: 'Michael Brown', phone: '+1-555-0103', email: 'mike.brown@email.com' },
  { name: 'Emily Davis', phone: '+1-555-0104', email: 'emily.davis@email.com' },
  { name: 'David Wilson', phone: '+1-555-0105', email: 'david.w@email.com' },
  { name: 'Lisa Anderson', phone: '+1-555-0106', email: 'lisa.anderson@email.com' },
  { name: 'Walk-in Customer', phone: null, email: null }
];

async function getOrCreateUser() {
  console.log('🔍 Finding user...');
  
  // Try to find an existing user
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, email')
    .limit(1);

  if (userError) {
    console.error('❌ Error fetching users:', userError);
    throw userError;
  }

  if (users && users.length > 0) {
    console.log('✅ Found existing user:', users[0].email);
    return users[0];
  }

  console.log('❌ No users found. Please login to the application first to create a user.');
  throw new Error('No users found. Please login to the application first.');
}

async function clearExistingData() {
  console.log('🧹 Clearing existing sample data...');
  
  // Clear in correct order due to foreign key constraints
  await supabase.from('sale_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('stock_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('inventory').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('medicines').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('✅ Existing data cleared');
}

async function createMedicines(userId) {
  console.log('💊 Creating sample medicines...');
  
  const medicinesWithUser = sampleMedicines.map(med => ({
    ...med,
    user_id: userId
  }));

  const { data: medicines, error } = await supabase
    .from('medicines')
    .insert(medicinesWithUser)
    .select();

  if (error) {
    console.error('❌ Error creating medicines:', error);
    throw error;
  }

  console.log(`✅ Created ${medicines.length} medicines`);
  return medicines;
}

async function createInventory(medicines) {
  console.log('📦 Creating inventory records...');
  
  const inventoryRecords = sampleInventoryData.map(inv => {
    const medicine = medicines[inv.medicine_index];
    return {
      medicine_id: medicine.id,
      batch_number: inv.batch_number,
      purchase_price: medicine.purchase_price,
      selling_price: medicine.selling_price,
      quantity_in_stock: inv.quantity_in_stock,
      minimum_stock_level: inv.minimum_stock_level,
      maximum_stock_level: inv.maximum_stock_level,
      supplier_name: inv.supplier_name,
      purchase_date: inv.purchase_date
    };
  });

  const { data: inventory, error } = await supabase
    .from('inventory')
    .insert(inventoryRecords)
    .select();

  if (error) {
    console.error('❌ Error creating inventory:', error);
    throw error;
  }

  console.log(`✅ Created ${inventory.length} inventory records`);
  return inventory;
}

async function createStockMovements(medicines, userId) {
  console.log('📊 Creating stock movement records...');
  
  const stockMovements = medicines.map((medicine, index) => {
    const invData = sampleInventoryData[index];
    return {
      medicine_id: medicine.id,
      movement_type: 'purchase',
      quantity_change: invData.quantity_in_stock,
      created_by: userId,
      notes: `Initial stock purchase from ${invData.supplier_name} - Batch: ${invData.batch_number}`
    };
  });

  const { data: movements, error } = await supabase
    .from('stock_movements')
    .insert(stockMovements)
    .select();

  if (error) {
    console.error('❌ Error creating stock movements:', error);
    throw error;
  }

  console.log(`✅ Created ${movements.length} stock movement records`);
  return movements;
}

async function createSales(medicines, userId) {
  console.log('💰 Creating sample sales...');
  
  const salesData = [
    {
      customer: sampleCustomers[0],
      items: [
        { medicine_index: 0, quantity: 2 }, // Paracetamol
        { medicine_index: 1, quantity: 1 }  // Ibuprofen
      ],
      discount_amount: 1.50,
      tax_amount: 1.20,
      payment_method: 'cash',
      notes: 'Regular customer discount applied'
    },
    {
      customer: sampleCustomers[1],
      items: [
        { medicine_index: 2, quantity: 1 }  // Amoxicillin
      ],
      discount_amount: 0,
      tax_amount: 1.50,
      payment_method: 'card',
      notes: 'Prescription sale'
    },
    {
      customer: sampleCustomers[2],
      items: [
        { medicine_index: 3, quantity: 3 }, // Aspirin
        { medicine_index: 4, quantity: 2 }  // Omeprazole
      ],
      discount_amount: 2.00,
      tax_amount: 2.10,
      payment_method: 'upi',
      notes: 'Bulk purchase discount'
    },
    {
      customer: sampleCustomers[6], // Walk-in customer
      items: [
        { medicine_index: 0, quantity: 1 }  // Paracetamol
      ],
      discount_amount: 0,
      tax_amount: 0.50,
      payment_method: 'cash',
      notes: 'Walk-in purchase'
    },
    {
      customer: sampleCustomers[3],
      items: [
        { medicine_index: 1, quantity: 2 }, // Ibuprofen
        { medicine_index: 3, quantity: 1 }  // Aspirin
      ],
      discount_amount: 0.75,
      tax_amount: 1.30,
      payment_method: 'card',
      notes: 'Insurance co-pay'
    }
  ];

  const createdSales = [];

  for (const saleData of salesData) {
    // Calculate totals
    let total_amount = 0;
    const saleItems = saleData.items.map(item => {
      const medicine = medicines[item.medicine_index];
      const unit_price = medicine.selling_price;
      const total_price = item.quantity * unit_price;
      total_amount += total_price;
      
      return {
        medicine_id: medicine.id,
        quantity: item.quantity,
        unit_price: unit_price,
        total_price: total_price
      };
    });

    const final_amount = total_amount - saleData.discount_amount + saleData.tax_amount;

    // Create sale
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        user_id: userId,
        customer_name: saleData.customer.name,
        customer_phone: saleData.customer.phone,
        customer_email: saleData.customer.email,
        total_amount: total_amount,
        discount_amount: saleData.discount_amount,
        tax_amount: saleData.tax_amount,
        final_amount: final_amount,
        payment_method: saleData.payment_method,
        notes: saleData.notes,
        status: 'completed'
      })
      .select()
      .single();

    if (saleError) {
      console.error('❌ Error creating sale:', saleError);
      throw saleError;
    }

    // Create sale items
    const saleItemsWithSaleId = saleItems.map(item => ({
      ...item,
      sale_id: sale.id
    }));

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItemsWithSaleId);

    if (itemsError) {
      console.error('❌ Error creating sale items:', itemsError);
      throw itemsError;
    }

    // Update inventory and create stock movements
    for (const item of saleItems) {
      // Get current inventory
      const { data: currentInventory } = await supabase
        .from('inventory')
        .select('quantity_in_stock')
        .eq('medicine_id', item.medicine_id)
        .single();

      if (currentInventory) {
        const newQuantity = currentInventory.quantity_in_stock - item.quantity;
        
        // Update inventory
        await supabase
          .from('inventory')
          .update({ quantity_in_stock: newQuantity })
          .eq('medicine_id', item.medicine_id);

        // Create stock movement
        await supabase
          .from('stock_movements')
          .insert({
            medicine_id: item.medicine_id,
            movement_type: 'sale',
            quantity_change: -item.quantity,
            reference_id: sale.id,
            created_by: userId,
            notes: `Sale to ${saleData.customer.name || 'Walk-in Customer'}`
          });
      }
    }

    createdSales.push(sale);
  }

  console.log(`✅ Created ${createdSales.length} sales with items and updated inventory`);
  return createdSales;
}

async function generatePredictions() {
  console.log('🤖 Generating restock predictions...');
  
  try {
    // This would normally call the prediction API, but for now we'll create some sample predictions
    const { data: medicines } = await supabase
      .from('medicines')
      .select('id, name')
      .limit(3);

    if (medicines && medicines.length > 0) {
      const predictions = medicines.map((medicine, index) => {
        const daysUntilStockout = [15, 8, 25][index];
        const predictedDate = new Date();
        predictedDate.setDate(predictedDate.getDate() + daysUntilStockout);

        return {
          medicine_id: medicine.id,
          predicted_stock_out_date: predictedDate.toISOString().split('T')[0],
          recommended_reorder_quantity: [50, 75, 30][index],
          confidence_score: [0.85, 0.92, 0.78][index],
          prediction_factors: {
            current_stock: [45, 8, 60][index],
            daily_sales_rate: [3.2, 1.8, 2.4][index],
            seasonal_multiplier: 1.1,
            days_until_stockout: daysUntilStockout,
            safety_stock: [15, 20, 12][index],
            lead_time_days: 7
          }
        };
      });

      const { error } = await supabase
        .from('restock_predictions')
        .insert(predictions);

      if (error) {
        console.error('❌ Error creating predictions:', error);
      } else {
        console.log(`✅ Created ${predictions.length} restock predictions`);
      }
    }
  } catch (error) {
    console.error('❌ Error generating predictions:', error);
  }
}

async function main() {
  try {
    console.log('🚀 Starting sample data population...\n');

    // Get or create user
    const user = await getOrCreateUser();

    // Clear existing data
    await clearExistingData();

    // Create medicines
    const medicines = await createMedicines(user.id);

    // Create inventory
    const inventory = await createInventory(medicines);

    // Create stock movements
    await createStockMovements(medicines, user.id);

    // Create sales
    const sales = await createSales(medicines, user.id);

    // Generate predictions
    await generatePredictions();

    console.log('\n🎉 Sample data population completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • ${medicines.length} medicines created`);
    console.log(`   • ${inventory.length} inventory records created`);
    console.log(`   • ${sales.length} sales transactions created`);
    console.log('   • Stock movements and predictions generated');
    console.log('\n✅ You can now view the data in the Sales and Inventory pages!');

  } catch (error) {
    console.error('\n❌ Error populating sample data:', error.message);
    process.exit(1);
  }
}

// Run the script
main();