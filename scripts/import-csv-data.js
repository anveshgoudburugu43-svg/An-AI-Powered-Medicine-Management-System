const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Helper function to parse CSV
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, index) => {
      obj[header.trim()] = values[index] ? values[index].trim() : null;
    });
    return obj;
  });
}

// Convert MM/YY to full date (last day of month)
function convertExpiryDate(mmyy) {
  if (!mmyy || mmyy.length < 5) return null;
  const [month, year] = mmyy.split('/');
  const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
  const lastDay = new Date(fullYear, parseInt(month), 0).getDate();
  return `${fullYear}-${month.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
}

async function importDrugs() {
  console.log('📦 Importing drugs from DRUGS.csv...');
  
  try {
    const csvContent = fs.readFileSync(path.join(__dirname, '..', 'DRUGS.csv'), 'utf8');
    const   drugs = parseCSV(csvContent);
    
    console.log(`Found ${drugs.length} drugs to import`);
    
    for (const drug of drugs) {
      // Create medicine record
      const medicineData = {
        user_id: 'a91400a5-1757-4563-b10d-9f04e1ff3903', // Default user ID
        name: drug.brandName,
        generic_name: drug.genericName,
        ndc_code: drug.NDC,
        dosage: drug.dosage + 'mg',
        expiry_date: convertExpiryDate(drug.expDate),
        purchase_price: parseFloat(drug.purchasePrice),
        selling_price: parseFloat(drug.sellPrice),
        quantity: Math.floor(Math.random() * 100) + 20, // Random initial stock
        status: 'active'
      };
      
      const { data: medicine, error: medError } = await supabase
        .from('medicines')
        .insert(medicineData)
        .select()
        .single();
      
      if (medError) {
        console.error(`Error creating medicine ${drug.brandName}:`, medError);
        continue;
      }
      
      // Create inventory record
      const inventoryData = {
        medicine_id: medicine.id,
        batch_number: `BATCH-${drug.NDC}`,
        purchase_price: parseFloat(drug.purchasePrice),
        selling_price: parseFloat(drug.sellPrice),
        quantity_in_stock: medicineData.quantity,
        minimum_stock_level: 10,
        maximum_stock_level: 100,
        supplier_name: `Supplier ${drug.supID}`,
        purchase_date: new Date().toISOString().split('T')[0]
      };
      
      const { error: invError } = await supabase
        .from('inventory')
        .insert(inventoryData);
      
      if (invError) {
        console.error(`Error creating inventory for ${drug.brandName}:`, invError);
      }
    }
    
    console.log('✅ Drugs import completed');
  } catch (error) {
    console.error('Error importing drugs:', error);
  }
}

async function importPatients() {
  console.log('👥 Importing patients from PATIENT1(1).csv...');
  
  try {
    const csvContent = fs.readFileSync(path.join(__dirname, '..', 'PATIENT1(1).csv'), 'utf8');
    const patients = parseCSV(csvContent);
    
    console.log(`Found ${patients.length} patients to import`);
    
    const patientData = patients.map(patient => ({
      patient_id: patient.patientID,
      first_name: patient.firstName,
      last_name: patient.lastName,
      birthdate: patient.birthdate ? new Date(patient.birthdate).toISOString().split('T')[0] : null,
      address: patient.address,
      phone: patient.phone,
      gender: patient.gender || null,
      insurance: patient.insurance || null
    }));
    
    const { data, error } = await supabase
      .from('patients')
      .insert(patientData)
      .select();
    
    if (error) {
      console.error('Error importing patients:', error);
    } else {
      console.log(`✅ Imported ${data.length} patients`);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error importing patients:', error);
    return [];
  }
}

async function importPrescriptions() {
  console.log('💊 Importing prescriptions from PRESCRIPTIONS.csv...');
  
  try {
    const csvContent = fs.readFileSync(path.join(__dirname, '..', 'PRESCRIPTIONS.csv'), 'utf8');
    const prescriptions = parseCSV(csvContent);
    
    console.log(`Found ${prescriptions.length} prescriptions to import`);
    
    // Get patients and medicines for mapping
    const { data: patients } = await supabase.from('patients').select('*');
    const { data: medicines } = await supabase.from('medicines').select('*');
    
    // Create some sample physicians
    const samplePhysicians = [
      { physician_id: '1', name: 'Dr. John Smith', specialty: 'General Medicine' },
      { physician_id: '2', name: 'Dr. Sarah Johnson', specialty: 'Cardiology' },
      { physician_id: '3', name: 'Dr. Michael Brown', specialty: 'Internal Medicine' },
      { physician_id: '5', name: 'Dr. Emily Davis', specialty: 'Family Medicine' },
      { physician_id: '7', name: 'Dr. Robert Wilson', specialty: 'Geriatrics' },
      { physician_id: '9', name: 'Dr. Lisa Anderson', specialty: 'Pediatrics' }
    ];
    
    const { data: physicians } = await supabase
      .from('physicians')
      .insert(samplePhysicians)
      .select();
    
    for (const prescription of prescriptions) {
      const patient = patients?.find(p => p.patient_id === prescription.patientID);
      const physician = physicians?.find(p => p.physician_id === prescription.physID);
      const medicine = medicines?.find(m => m.ndc_code === prescription.NDC);
      
      if (patient && physician && medicine) {
        const prescriptionData = {
          patient_id: patient.id,
          physician_id: physician.id,
          medicine_id: medicine.id,
          ndc_code: prescription.NDC,
          quantity: parseInt(prescription.qty) || 30,
          days_supply: parseInt(prescription.days) || 30,
          refills_remaining: parseInt(prescription.refills) || 0,
          status: prescription.status || 'pending',
          prescribed_date: new Date().toISOString().split('T')[0]
        };
        
        const { error } = await supabase
          .from('prescriptions')
          .insert(prescriptionData);
        
        if (error) {
          console.error(`Error creating prescription:`, error);
        }
      }
    }
    
    console.log('✅ Prescriptions import completed');
  } catch (error) {
    console.error('Error importing prescriptions:', error);
  }
}

async function main() {
  console.log('🚀 Starting CSV data import...');
  
  await importDrugs();
  await importPatients();
  await importPrescriptions();
  
  console.log('✅ All CSV data imported successfully!');
}

main().catch(console.error);