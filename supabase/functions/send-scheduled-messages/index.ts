import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[send-scheduled-messages] Starting scheduled message processing...');

    // Get all pending scheduled messages that are due
    const now = new Date().toISOString();
    const { data: dueMessages, error: fetchError } = await supabase
      .from('scheduled_messages')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .limit(50);

    if (fetchError) {
      console.error('[send-scheduled-messages] Error fetching scheduled messages:', fetchError);
      throw fetchError;
    }

    console.log(`[send-scheduled-messages] Found ${dueMessages?.length || 0} scheduled messages to send`);

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const scheduledMsg of dueMessages || []) {
      try {
        console.log(`[send-scheduled-messages] Processing message ${scheduledMsg.id}`);
        
        // Create or use existing thread
        let threadId = scheduledMsg.thread_id;
        
        if (!threadId && scheduledMsg.subject) {
          console.log('[send-scheduled-messages] Creating new thread');
          
          // Create new thread
          const { data: newThread, error: threadError } = await supabase
            .from('message_threads')
            .insert({
              subject: scheduledMsg.subject,
              created_by: scheduledMsg.sender_id,
              thread_type: scheduledMsg.message_type,
              requires_action: scheduledMsg.action_required,
              admin_only: scheduledMsg.admin_eyes_only,
              branch_id: scheduledMsg.branch_id,
              organization_id: scheduledMsg.organization_id
            })
            .select()
            .single();

          if (threadError) {
            console.error('[send-scheduled-messages] Thread creation error:', threadError);
            throw threadError;
          }
          
          threadId = newThread.id;
          console.log('[send-scheduled-messages] Created thread:', threadId);

          // Add sender as participant
          await supabase.from('message_participants').insert({
            thread_id: threadId,
            user_id: scheduledMsg.sender_id,
            user_type: 'admin',
            user_name: 'Sender'
          });

          // Add recipients as participants
          const recipientInserts = scheduledMsg.recipient_ids.map((recipientId: string) => ({
            thread_id: threadId,
            user_id: recipientId,
            user_type: 'recipient',
            user_name: 'Recipient'
          }));

          await supabase.from('message_participants').insert(recipientInserts);
          console.log('[send-scheduled-messages] Added participants');
        }

        // Insert message
        console.log('[send-scheduled-messages] Inserting message into thread:', threadId);
        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            thread_id: threadId,
            sender_id: scheduledMsg.sender_id,
            sender_type: 'admin',
            content: scheduledMsg.content,
            message_type: scheduledMsg.message_type,
            priority: scheduledMsg.priority,
            action_required: scheduledMsg.action_required,
            admin_eyes_only: scheduledMsg.admin_eyes_only,
            has_attachments: (scheduledMsg.attachments as any[])?.length > 0,
            attachments: scheduledMsg.attachments,
            notification_methods: scheduledMsg.notification_methods
          });

        if (messageError) {
          console.error('[send-scheduled-messages] Message insert error:', messageError);
          throw messageError;
        }

        // Update thread's last_message_at
        await supabase
          .from('message_threads')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', threadId);

        // Mark scheduled message as sent
        await supabase
          .from('scheduled_messages')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            thread_id: threadId
          })
          .eq('id', scheduledMsg.id);

        results.sent++;
        console.log(`[send-scheduled-messages] Successfully sent scheduled message ${scheduledMsg.id}`);

      } catch (error: any) {
        console.error(`[send-scheduled-messages] Failed to send scheduled message ${scheduledMsg.id}:`, error);
        
        // Mark as failed
        await supabase
          .from('scheduled_messages')
          .update({
            status: 'failed',
            error_message: error.message
          })
          .eq('id', scheduledMsg.id);

        results.failed++;
        results.errors.push(`${scheduledMsg.id}: ${error.message}`);
      }
    }

    console.log('[send-scheduled-messages] Processing complete:', results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('[send-scheduled-messages] Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
