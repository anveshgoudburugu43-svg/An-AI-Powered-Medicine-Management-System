const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function cleanupExpiredNotifications() {
  console.log('🧹 Starting cleanup of expired medicine notifications...');
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get all expired medicines
    const { data: expiredMedicines, error: medicineError } = await supabase
      .from('medicines')
      .select('id, name, expiry_date')
      .lt('expiry_date', today);

    if (medicineError) {
      console.error('❌ Error fetching expired medicines:', medicineError);
      return;
    }

    if (!expiredMedicines || expiredMedicines.length === 0) {
      console.log('✅ No expired medicines found. Nothing to clean up.');
      return;
    }

    console.log(`📋 Found ${expiredMedicines.length} expired medicines:`);
    expiredMedicines.forEach(med => {
      console.log(`   - ${med.name} (expired: ${med.expiry_date})`);
    });

    const expiredMedicineIds = expiredMedicines.map(med => med.id);

    // Remove notifications for expired medicines
    const { error: deleteError, count } = await supabase
      .from('notifications')
      .delete()
      .in('medicine_id', expiredMedicineIds)
      .in('type', ['expiry_warning', 'expired', 'stock_expiry']);

    if (deleteError) {
      console.error('❌ Error removing expired medicine notifications:', deleteError);
      return;
    }

    console.log(`✅ Successfully removed ${count || 0} notifications for expired medicines`);
    console.log('🎉 Cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Run the cleanup
cleanupExpiredNotifications().catch(console.error);