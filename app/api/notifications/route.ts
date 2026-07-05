import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const unread_only = searchParams.get('unread_only') === 'true';

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    if (unread_only) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    // Note: checkExpiringMedicines should be called by a cron job, not every time notifications are fetched
    // await checkExpiringMedicines(user.id);

    return NextResponse.json(notifications || []);
  } catch (error) {
    console.error('Error in GET /api/notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { id, is_read, mark_all_read } = body;

    if (mark_all_read) {
      // Mark all notifications as read for the user
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
      }
    } else if (id) {
      // Mark specific notification as read
      const { error } = await supabase
        .from('notifications')
        .update({ is_read })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating notification:', error);
        return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { type, title, message, related_id, recipient_ids } = body;

    // Validate required fields
    if (!type || !title || !message) {
      return NextResponse.json({ error: 'Type, title, and message are required' }, { status: 400 });
    }

    // If recipient_ids provided, create notifications for specific users (admin feature)
    if (recipient_ids && Array.isArray(recipient_ids)) {
      // Check if user has admin privileges
      if (user.role !== 'Manager' && user.role !== 'Pharmacist') {
        return NextResponse.json({ error: 'Insufficient privileges' }, { status: 403 });
      }

      const notifications = recipient_ids.map(recipient_id => ({
        user_id: recipient_id,
        type,
        title,
        message,
        related_id
      }));

      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) {
        console.error('Error creating notifications:', error);
        return NextResponse.json({ error: 'Failed to create notifications' }, { status: 500 });
      }

      return NextResponse.json({ notifications: data });
    } else {
      // Create notification for current user
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type,
          title,
          message,
          related_id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
      }

      return NextResponse.json({ notification });
    }
  } catch (error) {
    console.error('Error in POST /api/notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to check for expiring medicines
async function checkExpiringMedicines(userId: string) {
  try {
    const today = new Date();
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

    // Get medicines expiring in the next 2 weeks (but not already expired)
    const { data: expiringMedicines, error } = await supabase
      .from('medicines')
      .select('id, name, expiry_date, quantity')
      .gte('expiry_date', today.toISOString().split('T')[0]) // Not expired yet
      .lte('expiry_date', twoWeeksFromNow.toISOString().split('T')[0]) // Expires within 2 weeks
      .gt('quantity', 0)
      .eq('user_id', userId);

    if (error) {
      console.error('Error checking expiring medicines:', error);
      return;
    }

    if (expiringMedicines && expiringMedicines.length > 0) {
      // Check if we already have notifications for these medicines
      const medicineIds = expiringMedicines.map(m => m.id);
      const { data: existingNotifications } = await supabase
        .from('notifications')
        .select('related_id')
        .eq('user_id', userId)
        .eq('type', 'stock_expiry')
        .in('related_id', medicineIds)
        .eq('is_read', false);

      const existingIds = existingNotifications?.map(n => n.related_id) || [];
      const newExpiringMedicines = expiringMedicines.filter(m => !existingIds.includes(m.id));

      if (newExpiringMedicines.length > 0) {
        const notifications = newExpiringMedicines.map(medicine => {
          const daysUntilExpiry = Math.ceil(
            (new Date(medicine.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );

          return {
            user_id: userId,
            type: 'stock_expiry',
            title: 'Medicine Expiring Soon',
            message: `${medicine.name} expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} (Qty: ${medicine.quantity})`,
            related_id: medicine.id
          };
        });

        await supabase
          .from('notifications')
          .insert(notifications);
      }
    }

    // Clean up notifications for already expired medicines
    await cleanupExpiredNotifications(userId);
  } catch (error) {
    console.error('Error in checkExpiringMedicines:', error);
  }
}

// Helper function to clean up notifications for expired medicines
async function cleanupExpiredNotifications(userId: string) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get expired medicines for this user
    const { data: expiredMedicines } = await supabase
      .from('medicines')
      .select('id')
      .lt('expiry_date', today)
      .eq('user_id', userId);

    if (expiredMedicines && expiredMedicines.length > 0) {
      const expiredMedicineIds = expiredMedicines.map(med => med.id);
      
      // Remove notifications for expired medicines
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .in('medicine_id', expiredMedicineIds)
        .in('type', ['expiry_warning', 'expired', 'stock_expiry']);
    }
  } catch (error) {
    console.error('Error cleaning up expired notifications:', error);
  }
}