import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'sent', 'received', 'all'
    const tag = searchParams.get('tag');
    const status = searchParams.get('status');

    let query = supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter based on type
    if (type === 'sent') {
      query = query.eq('sender_id', user.id);
    } else if (type === 'received') {
      query = query.or(`recipient_id.eq.${user.id},and(is_admin_message.eq.true,sender_id.neq.${user.id})`);
    } else {
      // All messages - sent or received
      query = query.or(`sender_id.eq.${user.id},recipient_id.eq.${user.id},and(is_admin_message.eq.true,sender_id.neq.${user.id})`);
    }

    // Apply filters
    if (tag) {
      query = query.eq('tag', tag);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // Only get parent messages (not replies)
    query = query.is('parent_message_id', null);

    const { data: messages, error } = await query;

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Enrich messages with user data and fetch replies
    const enrichedMessages = await Promise.all(
      (messages || []).map(async (message) => {
        // Fetch sender info
        const { data: sender } = await supabase
          .from('users')
          .select('id, email, full_name, role')
          .eq('id', message.sender_id)
          .single();

        // Fetch recipient info if exists
        let recipient = null;
        if (message.recipient_id) {
          const { data: recipientData } = await supabase
            .from('users')
            .select('id, email, full_name, role')
            .eq('id', message.recipient_id)
            .single();
          recipient = recipientData;
        }

        // Fetch replies for this message
        const { data: replies } = await supabase
          .from('messages')
          .select('*')
          .eq('parent_message_id', message.id)
          .order('created_at', { ascending: true });

        // Enrich replies with user data
        const enrichedReplies = await Promise.all(
          (replies || []).map(async (reply) => {
            const { data: replySender } = await supabase
              .from('users')
              .select('id, email, full_name, role')
              .eq('id', reply.sender_id)
              .single();

            return {
              ...reply,
              sender: replySender || { id: reply.sender_id, email: 'Unknown', full_name: 'Unknown User', role: 'Unknown' }
            };
          })
        );

        return {
          ...message,
          sender: sender || { id: message.sender_id, email: 'Unknown', full_name: 'Unknown User', role: 'Unknown' },
          recipient: recipient || (message.recipient_id ? { id: message.recipient_id, email: 'Unknown', full_name: 'Unknown User', role: 'Unknown' } : null),
          replies: enrichedReplies
        };
      })
    );

    return NextResponse.json(enrichedMessages);
  } catch (error) {
    console.error('Error in GET /api/messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const {
      recipient_id,
      subject,
      content,
      tag = 'general',
      is_admin_message = false,
      parent_message_id
    } = body;

    // Validate required fields
    if (!subject || !content) {
      return NextResponse.json({ error: 'Subject and content are required' }, { status: 400 });
    }

    // If it's an admin message, ensure user has admin privileges
    if (is_admin_message && !user.is_admin && user.role !== 'Manager') {
      return NextResponse.json({ error: 'Only admins can send admin messages' }, { status: 403 });
    }

    // Create message
    const messageData: any = {
      sender_id: user.id,
      subject,
      content,
      tag,
      is_admin_message: is_admin_message || false,
      parent_message_id: parent_message_id || null
    };

    if (!is_admin_message && recipient_id) {
      messageData.recipient_id = recipient_id;
    }

    console.log('Creating message with data:', messageData);

    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert(messageData)
      .select('*')
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return NextResponse.json({ 
        error: 'Failed to create message', 
        details: messageError.message,
        code: messageError.code 
      }, { status: 500 });
    }

    // If it's an admin message, create recipients for all admins
    if (is_admin_message) {
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .or('is_admin.eq.true,role.eq.Manager')
        .neq('id', user.id); // Exclude sender

      if (admins && admins.length > 0) {
        const recipients = admins.map(admin => ({
          message_id: message.id,
          recipient_id: admin.id
        }));

        await supabase
          .from('message_recipients')
          .insert(recipients);
      }
    }

    // Create notification for recipient(s)
    await createMessageNotification(message, is_admin_message);

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error in POST /api/messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { message_id, is_read } = body;

    if (!message_id) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
    }

    // Update message read status
    const { data: message, error } = await supabase
      .from('messages')
      .update({ is_read })
      .eq('id', message_id)
      .or(`recipient_id.eq.${user.id},sender_id.eq.${user.id}`) // User can mark their own messages as read
      .select()
      .single();

    if (error) {
      console.error('Error updating message:', error);
      return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error in PATCH /api/messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function createMessageNotification(message: any, isAdminMessage: boolean) {
  try {
    if (isAdminMessage) {
      // Create notifications for all admins
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .or('is_admin.eq.true,role.eq.Manager')
        .neq('id', message.sender_id);

      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.id,
          type: 'message',
          title: `New message: ${message.subject}`,
          message: `${message.sender.full_name || message.sender.email} sent a message`,
          data: { message_id: message.id, tag: message.tag }
        }));

        await supabase
          .from('notifications')
          .insert(notifications);
      }
    } else if (message.recipient_id) {
      // Create notification for specific recipient
      await supabase
        .from('notifications')
        .insert({
          user_id: message.recipient_id,
          type: 'message',
          title: `New message: ${message.subject}`,
          message: `${message.sender.full_name || message.sender.email} sent you a message`,
          data: { message_id: message.id, tag: message.tag }
        });
    }
  } catch (error) {
    console.error('Error creating message notification:', error);
  }
}