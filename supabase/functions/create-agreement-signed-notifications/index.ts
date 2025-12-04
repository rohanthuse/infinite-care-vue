import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgreementSignedNotificationRequest {
  agreement_id: string;
  agreement_title: string;
  signer_name: string;
  signer_type: string;
  signer_auth_user_id: string;
  branch_id: string;
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
      agreement_id, 
      agreement_title, 
      signer_name, 
      signer_type, 
      signer_auth_user_id, 
      branch_id 
    }: AgreementSignedNotificationRequest = await req.json();

    console.log('[create-agreement-signed-notifications] Request received:', {
      agreement_id,
      agreement_title,
      signer_name,
      signer_type,
      branch_id
    });

    if (!agreement_id || !agreement_title || !branch_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: agreement_id, agreement_title, branch_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Collect all admin user IDs
    const adminUserIds = new Set<string>();

    // Fetch branch admins from admin_branches table
    const { data: branchAdmins, error: adminError } = await supabase
      .from('admin_branches')
      .select('admin_id')
      .eq('branch_id', branch_id);

    if (adminError) {
      console.error('[create-agreement-signed-notifications] Error fetching branch admins:', adminError);
    } else if (branchAdmins && branchAdmins.length > 0) {
      console.log('[create-agreement-signed-notifications] Found branch admins:', branchAdmins.length);
      branchAdmins.forEach(admin => {
        if (admin.admin_id) {
          adminUserIds.add(admin.admin_id);
        }
      });
    }

    // Fetch super admins from user_roles table
    const { data: superAdmins, error: superAdminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'super_admin');

    if (superAdminError) {
      console.error('[create-agreement-signed-notifications] Error fetching super admins:', superAdminError);
    } else if (superAdmins && superAdmins.length > 0) {
      console.log('[create-agreement-signed-notifications] Found super admins:', superAdmins.length);
      superAdmins.forEach(admin => {
        if (admin.user_id) {
          adminUserIds.add(admin.user_id);
        }
      });
    }

    console.log('[create-agreement-signed-notifications] Total admin user IDs:', Array.from(adminUserIds));

    if (adminUserIds.size === 0) {
      console.log('[create-agreement-signed-notifications] No admins found to notify');
      return new Response(
        JSON.stringify({ success: true, notifications_created: 0, message: 'No admins found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify profiles exist for these users
    const { data: validProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .in('id', Array.from(adminUserIds));

    if (profileError) {
      console.error('[create-agreement-signed-notifications] Error verifying profiles:', profileError);
      throw profileError;
    }

    const validUserIds = validProfiles?.map(p => p.id) || [];
    console.log('[create-agreement-signed-notifications] Valid profiles found:', validUserIds.length);

    if (validUserIds.length === 0) {
      console.log('[create-agreement-signed-notifications] No users with valid profiles');
      return new Response(
        JSON.stringify({ success: true, notifications_created: 0, message: 'No users with valid profiles' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch organization_id from branch for proper notification separation
    let branchOrganizationId: string | null = null;
    const { data: branchData, error: branchOrgError } = await supabase
      .from('branches')
      .select('organization_id')
      .eq('id', branch_id)
      .single();

    if (branchOrgError) {
      console.warn('[create-agreement-signed-notifications] Error fetching branch organization:', branchOrgError);
    } else {
      branchOrganizationId = branchData?.organization_id || null;
    }
    console.log('[create-agreement-signed-notifications] Branch organization_id:', branchOrganizationId);

    // Determine signer message based on type
    const signerMessage = signer_type === 'client' 
      ? 'A client has signed an agreement.' 
      : 'A carer/staff has signed an agreement.';

    const displayName = signer_name || (signer_type === 'client' ? 'A client' : 'A staff member');

    // Create notifications for all admins
    const notifications = validUserIds.map(userId => ({
      user_id: userId,
      branch_id: branch_id,
      organization_id: branchOrganizationId,
      type: 'info',
      category: 'info',
      priority: 'medium',
      title: 'Agreement Signed',
      message: `${displayName} has signed the agreement: ${agreement_title}`,
      data: {
        agreement_id,
        agreement_title,
        signer_name,
        signer_type,
        signer_auth_user_id,
        notification_type: 'agreement_signed',
        redirect_url: '/agreements?tab=signed'
      }
    }));

    console.log('[create-agreement-signed-notifications] Creating notifications:', notifications.length);

    const { data: insertedNotifications, error: insertError } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (insertError) {
      console.error('[create-agreement-signed-notifications] Error inserting notifications:', insertError);
      throw insertError;
    }

    console.log('[create-agreement-signed-notifications] Successfully created notifications:', insertedNotifications?.length);

    return new Response(
      JSON.stringify({
        success: true,
        notifications_created: insertedNotifications?.length || 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[create-agreement-signed-notifications] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create notifications', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
