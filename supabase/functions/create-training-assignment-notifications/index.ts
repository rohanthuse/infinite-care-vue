import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  training_course_id: string;
  training_title: string;
  staff_ids: string[];
  branch_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[create-training-assignment-notifications] Starting...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: NotificationPayload = await req.json();
    console.log('[create-training-assignment-notifications] Payload:', payload);

    const { training_course_id, training_title, staff_ids, branch_id } = payload;

    // Validate required fields
    if (!training_course_id || !training_title || !staff_ids || !branch_id) {
      console.error('[create-training-assignment-notifications] Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: training_course_id, training_title, staff_ids, branch_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!Array.isArray(staff_ids) || staff_ids.length === 0) {
      console.log('[create-training-assignment-notifications] No staff_ids provided');
      return new Response(
        JSON.stringify({ success: true, notifications_created: 0, message: 'No staff to notify' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[create-training-assignment-notifications] Processing staff_ids:', staff_ids);

    // Fetch auth_user_id for each staff member
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('id, auth_user_id, first_name, last_name')
      .in('id', staff_ids);

    if (staffError) {
      console.error('[create-training-assignment-notifications] Error fetching staff:', staffError);
      throw staffError;
    }

    console.log('[create-training-assignment-notifications] Found staff:', staffData?.length || 0);

    // Filter to staff with valid auth_user_id
    const validStaff = staffData?.filter(s => s.auth_user_id) || [];
    
    if (validStaff.length === 0) {
      console.log('[create-training-assignment-notifications] No staff with auth_user_id found');
      return new Response(
        JSON.stringify({ success: true, notifications_created: 0, message: 'No valid staff recipients found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userIds = validStaff.map(s => s.auth_user_id);
    console.log('[create-training-assignment-notifications] User IDs to notify:', userIds);

    // Verify profiles exist for these users
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .in('id', userIds);

    if (profileError) {
      console.error('[create-training-assignment-notifications] Error fetching profiles:', profileError);
      throw profileError;
    }

    const validProfileIds = profiles?.map(p => p.id) || [];
    console.log('[create-training-assignment-notifications] Valid profile IDs:', validProfileIds.length);

    if (validProfileIds.length === 0) {
      console.log('[create-training-assignment-notifications] No valid profiles found');
      return new Response(
        JSON.stringify({ success: true, notifications_created: 0, message: 'No valid profiles found' }),
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
      console.warn('[create-training-assignment-notifications] Error fetching branch organization:', branchOrgError);
    } else {
      branchOrganizationId = branchData?.organization_id || null;
    }
    console.log('[create-training-assignment-notifications] Branch organization_id:', branchOrganizationId);

    // Create notifications for each valid user
    const notifications = validProfileIds.map(userId => ({
      user_id: userId,
      branch_id,
      organization_id: branchOrganizationId,
      type: 'info',
      category: 'info',
      priority: 'medium',
      title: 'New Training Assigned',
      message: `A new training program has been assigned to you: ${training_title}`,
      data: {
        training_course_id,
        notification_type: 'training_assignment'
      }
    }));

    console.log('[create-training-assignment-notifications] Creating notifications:', notifications.length);

    const { data: insertedNotifications, error: insertError } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (insertError) {
      console.error('[create-training-assignment-notifications] Error inserting notifications:', insertError);
      throw insertError;
    }

    console.log('[create-training-assignment-notifications] Successfully created notifications:', insertedNotifications?.length || 0);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notifications_created: insertedNotifications?.length || 0,
        message: `Notifications sent to ${insertedNotifications?.length || 0} staff members`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[create-training-assignment-notifications] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create notifications', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
