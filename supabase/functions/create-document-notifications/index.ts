import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentNotificationRequest {
  document_id: string;
  document_name: string;
  branch_id: string;
  access_level?: string; // 'public', 'branch', 'restricted'
  organization_id?: string; // Required for public access
  client_ids?: string[];
  staff_ids?: string[];
  // Fields for client document uploads
  notify_admins?: boolean;
  client_id?: string;
  client_name?: string;
  upload_timestamp?: string;
  // Fields for staff document uploads
  notify_admins_staff?: boolean;
  staff_id?: string;
  staff_name?: string;
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
      access_level,
      organization_id,
      client_ids, 
      staff_ids,
      notify_admins,
      client_id,
      client_name,
      upload_timestamp,
      notify_admins_staff,
      staff_id,
      staff_name
    }: DocumentNotificationRequest = await req.json();

    console.log('[create-document-notifications] Request received:', {
      document_id,
      document_name,
      branch_id,
      access_level,
      organization_id,
      client_ids_count: client_ids?.length || 0,
      staff_ids_count: staff_ids?.length || 0,
      notify_admins,
      client_id,
      client_name,
      notify_admins_staff,
      staff_id,
      staff_name
    });

    if (!document_id || !document_name || !branch_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: document_id, document_name, branch_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userIdsToNotify: string[] = [];

    // Handle client document uploads - notify branch admins
    if (notify_admins) {
      console.log('[create-document-notifications] Fetching branch admins for branch:', branch_id);
      
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
    }
    // Handle staff document uploads - notify branch admins
    else if (notify_admins_staff) {
      console.log('[create-document-notifications] Staff upload - fetching branch admins for branch:', branch_id);
      
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
    }
    // Handle document sharing based on access level
    else if (access_level === 'public' && organization_id) {
      // PUBLIC: Notify all clients and staff in the entire organization
      console.log('[create-document-notifications] Public access - fetching all users in organization:', organization_id);
      
      // Get all branches in the organization
      const { data: orgBranches, error: branchError } = await supabase
        .from('branches')
        .select('id')
        .eq('organization_id', organization_id);

      if (branchError) {
        console.error('[create-document-notifications] Error fetching org branches:', branchError);
      } else if (orgBranches && orgBranches.length > 0) {
        const branchIds = orgBranches.map(b => b.id);
        console.log('[create-document-notifications] Found branches in org:', branchIds.length);

        // Get all clients in these branches
        const { data: orgClients, error: clientError } = await supabase
          .from('clients')
          .select('auth_user_id')
          .in('branch_id', branchIds)
          .not('auth_user_id', 'is', null);

        if (clientError) {
          console.error('[create-document-notifications] Error fetching org clients:', clientError);
        } else if (orgClients) {
          console.log('[create-document-notifications] Found clients in org:', orgClients.length);
          orgClients.forEach(client => {
            if (client.auth_user_id) {
              userIdsToNotify.push(client.auth_user_id);
            }
          });
        }

        // Get all staff in these branches
        const { data: orgStaff, error: staffError } = await supabase
          .from('staff')
          .select('auth_user_id')
          .in('branch_id', branchIds)
          .not('auth_user_id', 'is', null);

        if (staffError) {
          console.error('[create-document-notifications] Error fetching org staff:', staffError);
        } else if (orgStaff) {
          console.log('[create-document-notifications] Found staff in org:', orgStaff.length);
          orgStaff.forEach(staff => {
            if (staff.auth_user_id) {
              userIdsToNotify.push(staff.auth_user_id);
            }
          });
        }
      }
    } 
    else if (access_level === 'branch') {
      // BRANCH: Notify all clients and staff in the specific branch
      console.log('[create-document-notifications] Branch access - fetching all users in branch:', branch_id);

      // Get all clients in this branch
      const { data: branchClients, error: clientError } = await supabase
        .from('clients')
        .select('auth_user_id')
        .eq('branch_id', branch_id)
        .not('auth_user_id', 'is', null);

      if (clientError) {
        console.error('[create-document-notifications] Error fetching branch clients:', clientError);
      } else if (branchClients) {
        console.log('[create-document-notifications] Found clients in branch:', branchClients.length);
        branchClients.forEach(client => {
          if (client.auth_user_id) {
            userIdsToNotify.push(client.auth_user_id);
          }
        });
      }

      // Get all staff in this branch
      const { data: branchStaff, error: staffError } = await supabase
        .from('staff')
        .select('auth_user_id')
        .eq('branch_id', branch_id)
        .not('auth_user_id', 'is', null);

      if (staffError) {
        console.error('[create-document-notifications] Error fetching branch staff:', staffError);
      } else if (branchStaff) {
        console.log('[create-document-notifications] Found staff in branch:', branchStaff.length);
        branchStaff.forEach(staff => {
          if (staff.auth_user_id) {
            userIdsToNotify.push(staff.auth_user_id);
          }
        });
      }
    }
    else {
      // RESTRICTED or fallback: Notify specific clients/staff
      console.log('[create-document-notifications] Restricted access - notifying specific users');
      
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

    // Determine notification content
    let notificationTitle: string;
    let notificationMessage: string;
    let notificationData: Record<string, unknown>;

    if (notify_admins && client_name) {
      // Client document upload notification for admins
      const formattedDateTime = upload_timestamp 
        ? new Date(upload_timestamp).toLocaleString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
          })
        : new Date().toLocaleString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
          });
      
      notificationTitle = 'New Client Document Uploaded';
      notificationMessage = `${client_name} uploaded "${document_name}" on ${formattedDateTime}`;
      notificationData = {
        document_id,
        client_id,
        client_name,
        document_name,
        notification_type: 'client_document_upload',
        redirect_url: '/documents',
        upload_timestamp
      };
    } else if (notify_admins_staff && staff_name) {
      // Staff document upload notification for admins
      notificationTitle = 'New Document Uploaded by Staff';
      notificationMessage = `${staff_name} has uploaded a new document. Click to view.`;
      notificationData = {
        document_id,
        staff_id,
        staff_name,
        document_name,
        notification_type: 'staff_document_upload',
        redirect_url: `/carers/${staff_id}/documents`
      };
    } else {
      // Standard document shared notification
      notificationTitle = 'New Document Shared';
      notificationMessage = 'A new document has been uploaded for you.';
      notificationData = {
        document_id,
        document_name,
        notification_type: 'document_shared',
        redirect_url: '/documents'
      };
    }

    const notifications = validUserIds.map(userId => ({
      user_id: userId,
      branch_id: branch_id,
      type: 'info',
      category: 'info',
      priority: notify_admins ? 'medium' : 'low',
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
        notifications_created: insertedNotifications?.length || 0,
        access_level: access_level || 'restricted'
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
