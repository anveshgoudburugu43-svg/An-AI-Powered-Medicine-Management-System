import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // This endpoint can be called by a cron job or scheduled task
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

    // Get medicines expiring in the next 2 weeks (future dates only)
    const { data: expiringMedicines, error } = await supabase
      .from('medicines')
      .select('id, name, expiry_date, quantity')
      .gte('expiry_date', new Date().toISOString()) // Only future dates (not expired)
      .lte('expiry_date', twoWeeksFromNow.toISOString()) // Within the next 2 weeks
      .gt('quantity', 0);

    if (error) {
      console.error('Error checking expiring medicines:', error);
      return NextResponse.json({ error: 'Failed to check expiring medicines' }, { status: 500 });
    }

    if (!expiringMedicines || expiringMedicines.length === 0) {
      return NextResponse.json({ message: 'No expiring medicines found' });
    }

    // Get all users who should receive notifications (managers, pharmacists)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .in('role', ['Manager', 'Pharmacist']);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users found to notify' });
    }

    // Create notifications for each user and each expiring medicine
    const notifications = [];
    for (const user of users) {
      for (const medicine of expiringMedicines) {
        // Check if we already have a recent notification for this medicine and user (within last 24 hours)
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        const { data: existingNotification } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user.id)
          .eq('type', 'stock_expiry')
          .eq('related_id', medicine.id)
          .gte('created_at', oneDayAgo.toISOString())
          .single();

        if (!existingNotification) {
          const daysUntilExpiry = Math.ceil(
            (new Date(medicine.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );

          notifications.push({
            user_id: user.id,
            type: 'stock_expiry',
            title: 'Medicine Expiring Soon',
            message: `${medicine.name} expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} (Qty: ${medicine.quantity})`,
            related_id: medicine.id
          });
        }
      }
    }

    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) {
        console.error('Error creating notifications:', insertError);
        return NextResponse.json({ error: 'Failed to create notifications' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      message: `Created ${notifications.length} notifications for ${expiringMedicines.length} expiring medicines`,
      expiring_medicines: expiringMedicines.length,
      notifications_created: notifications.length
    });
  } catch (error) {
    console.error('Error in POST /api/notifications/check-expiry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}