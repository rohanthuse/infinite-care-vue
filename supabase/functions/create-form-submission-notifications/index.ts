import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FormSubmissionNotificationRequest {
  form_id: string;
  form_title: string;
  submitter_id: string;
  submitter_name: string;
  submitter_type: 'client' | 'staff' | 'carer';
  branch_id: string;
  submission_id?: string;
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
      form_id, 
      form_title, 
      submitter_id, 
      submitter_name, 
      submitter_type, 
      branch_id,
      submission_id 
    }: FormSubmissionNotificationRequest = await req.json();

    console.log('[create-form-submission-notifications] Request received:', {
      form_id,
      form_title,
      submitter_id,
      submitter_name,
      submitter_type,
      branch_id,
      submission_id
    });

    if (!form_id || !form_title || !submitter_id || !submitter_type || !branch_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
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
      console.error('[create-form-submission-notifications] Error fetching branch admins:', adminError);
    } else if (branchAdmins && branchAdmins.length > 0) {
      console.log('[create-form-submission-notifications] Found branch admins:', branchAdmins.length);
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
      console.error('[create-form-submission-notifications] Error fetching super admins:', superAdminError);
    } else if (superAdmins && superAdmins.length > 0) {
      console.log('[create-form-submission-notifications] Found super admins:', superAdmins.length);
      superAdmins.forEach(admin => {
        if (admin.user_id) {
          adminUserIds.add(admin.user_id);
        }
      });
    }

    console.log('[create-form-submission-notifications] Total admin user IDs:', Array.from(adminUserIds));

    if (adminUserIds.size === 0) {
      console.log('[create-form-submission-notifications] No admins found to notify');
      return new Response(
        JSON.stringify({ success: true, notifications_created: 0, message: 'No admins to notify' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify profiles exist for admin users
    const { data: validProfiles } = await supabase
      .from('profiles')
      .select('id')
      .in('id', Array.from(adminUserIds));

    const validUserIds = validProfiles?.map(p => p.id) || [];

    if (validUserIds.length === 0) {
      console.log('[create-form-submission-notifications] No valid admin profiles found');
      return new Response(
        JSON.stringify({ success: true, notifications_created: 0, message: 'No valid admin profiles' }),
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
      console.warn('[create-form-submission-notifications] Error fetching branch organization:', branchOrgError);
    } else {
      branchOrganizationId = branchData?.organization_id || null;
    }
    console.log('[create-form-submission-notifications] Branch organization_id:', branchOrganizationId);

    // Determine submitter message based on type
    const submitterMessage = submitter_type === 'client' 
      ? 'A client has submitted a form.' 
      : 'A carer/staff has submitted a form.';

    const displayName = submitter_name || (submitter_type === 'client' ? 'A client' : 'A staff member');

    // Create notifications for all admins
    const notifications = validUserIds.map(userId => ({
      user_id: userId,
      branch_id: branch_id,
      organization_id: branchOrganizationId,
      type: 'info',
      category: 'info',
      priority: 'medium',
      title: 'Form Submitted',
      message: `${displayName} has submitted the form: ${form_title}`,
      data: {
        form_id,
        form_title,
        submission_id,
        submitter_id,
        submitter_name,
        submitter_type,
        notification_type: 'form_submission',
        redirect_url: `/form-builder/${form_id}?tab=responses`
      }
    }));

    const { data: insertedNotifications, error: insertError } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (insertError) {
      console.error('[create-form-submission-notifications] Error inserting notifications:', insertError);
      throw insertError;
    }

    console.log('[create-form-submission-notifications] Created notifications:', insertedNotifications?.length);

    return new Response(
      JSON.stringify({ success: true, notifications_created: insertedNotifications?.length || 0 }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[create-form-submission-notifications] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create notification', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
