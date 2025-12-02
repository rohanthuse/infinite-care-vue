import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentNotificationRequest {
  document_id: string;
  document_name: string;
  branch_id: string;
  client_ids?: string[];
  staff_ids?: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { document_id, document_name, branch_id, client_ids, staff_ids }: DocumentNotificationRequest = await req.json();

    console.log('[create-document-notifications] Request received:', {
      document_id,
      document_name,
      branch_id,
      client_ids_count: client_ids?.length || 0,
      staff_ids_count: staff_ids?.length || 0
    });

    if (!document_id || !document_name || !branch_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: document_id, document_name, branch_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userIdsToNotify: string[] = [];

    // Get auth_user_ids for clients
    if (client_ids && client_ids.length > 0) {
      console.log('[create-document-notifications] Fetching auth_user_ids for clients:', client_ids);
      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('id, auth_user_id, first_name, last_name')
        .in('id', client_ids)
        .not('auth_user_id', 'is', null);

      if (clientError) {
        console.error('[create-document-notifications] Error fetching clients:', clientError);
      } else if (clients) {
        console.log('[create-document-notifications] Found clients with auth_user_ids:', clients.length);
        clients.forEach(client => {
          if (client.auth_user_id) {
            userIdsToNotify.push(client.auth_user_id);
          }
        });
      }
    }

    // Get auth_user_ids for staff
    if (staff_ids && staff_ids.length > 0) {
      console.log('[create-document-notifications] Fetching auth_user_ids for staff:', staff_ids);
      const { data: staffMembers, error: staffError } = await supabase
        .from('staff')
        .select('id, auth_user_id, first_name, last_name')
        .in('id', staff_ids)
        .not('auth_user_id', 'is', null);

      if (staffError) {
        console.error('[create-document-notifications] Error fetching staff:', staffError);
      } else if (staffMembers) {
        console.log('[create-document-notifications] Found staff with auth_user_ids:', staffMembers.length);
        staffMembers.forEach(staff => {
          if (staff.auth_user_id) {
            userIdsToNotify.push(staff.auth_user_id);
          }
        });
      }
    }

    // Remove duplicates
    const uniqueUserIds = [...new Set(userIdsToNotify)];
    console.log('[create-document-notifications] Unique user IDs to notify:', uniqueUserIds.length);

    if (uniqueUserIds.length === 0) {
      console.log('[create-document-notifications] No valid users to notify');
      return new Response(
        JSON.stringify({ success: true, notifications_created: 0, message: 'No valid users to notify' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify profiles exist for these users
    const { data: validProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .in('id', uniqueUserIds);

    if (profileError) {
      console.error('[create-document-notifications] Error verifying profiles:', profileError);
      throw profileError;
    }

    const validUserIds = validProfiles?.map(p => p.id) || [];
    console.log('[create-document-notifications] Valid profiles found:', validUserIds.length);

    if (validUserIds.length === 0) {
      console.log('[create-document-notifications] No users with valid profiles');
      return new Response(
        JSON.stringify({ success: true, notifications_created: 0, message: 'No users with valid profiles' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create notifications
    const notifications = validUserIds.map(userId => ({
      user_id: userId,
      branch_id: branch_id,
      type: 'info',
      category: 'info',
      priority: 'low',
      title: 'New Document Uploaded',
      message: `A new document has been uploaded: ${document_name}`,
      data: JSON.stringify({
        document_id,
        notification_type: 'document_upload'
      }),
      status: 'unread'
    }));

    console.log('[create-document-notifications] Creating notifications:', notifications.length);

    const { data: insertedNotifications, error: insertError } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (insertError) {
      console.error('[create-document-notifications] Error inserting notifications:', insertError);
      throw insertError;
    }

    console.log('[create-document-notifications] Successfully created notifications:', insertedNotifications?.length);

    return new Response(
      JSON.stringify({
        success: true,
        notifications_created: insertedNotifications?.length || 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[create-document-notifications] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create notifications', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
