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

    // Fetch branch admins (staff with is_admin: true) for the branch
    const { data: branchAdmins, error: adminError } = await supabase
      .from('staff')
      .select('auth_user_id')
      .eq('branch_id', branch_id)
      .eq('is_admin', true)
      .eq('status', 'active')
      .not('auth_user_id', 'is', null);

    if (adminError) {
      console.error('[create-form-submission-notifications] Error fetching branch admins:', adminError);
    }

    // Fetch super admins (profiles with role 'admin' or 'super_admin')
    const { data: superAdmins, error: superAdminError } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'super_admin']);

    if (superAdminError) {
      console.error('[create-form-submission-notifications] Error fetching super admins:', superAdminError);
    }

    // Collect all admin user IDs
    const adminUserIds = new Set<string>();
    
    if (branchAdmins) {
      branchAdmins.forEach(admin => {
        if (admin.auth_user_id) {
          adminUserIds.add(admin.auth_user_id);
        }
      });
    }

    if (superAdmins) {
      superAdmins.forEach(admin => {
        adminUserIds.add(admin.id);
      });
    }

    console.log('[create-form-submission-notifications] Found admin user IDs:', Array.from(adminUserIds));

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

    // Determine submitter label
    const submitterLabel = submitter_type === 'client' ? 'A client' : 'A staff member';
    const displayName = submitter_name || submitterLabel;

    // Create notifications for all admins
    const notifications = validUserIds.map(userId => ({
      user_id: userId,
      branch_id: branch_id,
      type: 'info',
      category: 'info',
      priority: 'medium',
      title: 'Form Submitted',
      message: `${displayName} has submitted the assigned form: ${form_title}`,
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
