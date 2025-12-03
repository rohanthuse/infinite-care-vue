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
  // New fields for client document uploads
  notify_admins?: boolean;
  client_id?: string;
  client_name?: string;
  upload_timestamp?: string;
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

    const { 
      document_id, 
      document_name, 
      branch_id, 
      client_ids, 
      staff_ids,
      notify_admins,
      client_id,
      client_name,
      upload_timestamp
    }: DocumentNotificationRequest = await req.json();

    console.log('[create-document-notifications] Request received:', {
      document_id,
      document_name,
      branch_id,
      client_ids_count: client_ids?.length || 0,
      staff_ids_count: staff_ids?.length || 0,
      notify_admins,
      client_id,
      client_name
    });

    if (!document_id || !document_name || !branch_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: document_id, document_name, branch_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userIdsToNotify: string[] = [];

    // NEW: Handle client document uploads - notify branch admins
    if (notify_admins) {
      console.log('[create-document-notifications] Fetching branch admins for branch:', branch_id);
      
      // Fetch admins who have access to this branch
      const { data: branchAdmins, error: adminError } = await supabase
        .from('admin_branches')
        .select('admin_id')
        .eq('branch_id', branch_id);

      if (adminError) {
        console.error('[create-document-notifications] Error fetching branch admins:', adminError);
      } else if (branchAdmins && branchAdmins.length > 0) {
        console.log('[create-document-notifications] Found branch admins:', branchAdmins.length);
        branchAdmins.forEach(admin => {
          if (admin.admin_id) {
            userIdsToNotify.push(admin.admin_id);
          }
        });
      }

      // Also check for super_admins who should see all notifications
      const { data: superAdmins, error: superAdminError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'super_admin');

      if (superAdminError) {
        console.error('[create-document-notifications] Error fetching super admins:', superAdminError);
      } else if (superAdmins && superAdmins.length > 0) {
        console.log('[create-document-notifications] Found super admins:', superAdmins.length);
        superAdmins.forEach(admin => {
          if (admin.user_id) {
            userIdsToNotify.push(admin.user_id);
          }
        });
      }
    } else {
      // Original logic for library resources - notify specific clients/staff
      
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

    // Format timestamp for display
    let formattedDateTime = '';
    if (upload_timestamp) {
      const date = new Date(upload_timestamp);
      formattedDateTime = date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } else {
      formattedDateTime = new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }

    // Create notifications with appropriate message
    let notificationTitle: string;
    let notificationMessage: string;
    let notificationData: Record<string, unknown>;

    if (notify_admins && client_name) {
      // Client document upload notification for admins
      notificationTitle = 'New Client Document Uploaded';
      notificationMessage = `${client_name} uploaded "${document_name}" on ${formattedDateTime}`;
      notificationData = {
        document_id,
        client_id,
        client_name,
        document_name,
        notification_type: 'client_document_upload',
        upload_timestamp
      };
    } else {
      // Library resource notification
      notificationTitle = 'New Document Uploaded';
      notificationMessage = `A new document has been uploaded: ${document_name}`;
      notificationData = {
        document_id,
        notification_type: 'document_upload'
      };
    }

    const notifications = validUserIds.map(userId => ({
      user_id: userId,
      branch_id: branch_id,
      type: 'info',
      category: 'info',
      priority: notify_admins ? 'medium' : 'low', // Higher priority for client uploads
      title: notificationTitle,
      message: notificationMessage,
      data: notificationData
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
