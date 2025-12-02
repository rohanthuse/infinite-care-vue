import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FormAssignmentNotificationRequest {
  form_id: string;
  form_title: string;
  assignee_id: string;
  assignee_type: 'client' | 'staff' | 'carer' | 'branch';
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

    const { form_id, form_title, assignee_id, assignee_type, branch_id }: FormAssignmentNotificationRequest = await req.json();

    console.log('[create-form-assignment-notifications] Request received:', {
      form_id,
      form_title,
      assignee_id,
      assignee_type,
      branch_id
    });

    if (!form_id || !form_title || !assignee_id || !assignee_type || !branch_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let authUserId: string | null = null;

    // Get auth_user_id based on assignee_type
    if (assignee_type === 'client') {
      const { data: client, error } = await supabase
        .from('clients')
        .select('auth_user_id')
        .eq('id', assignee_id)
        .single();

      if (error) {
        console.error('[create-form-assignment-notifications] Error fetching client:', error);
      } else {
        authUserId = client?.auth_user_id;
      }
    } else if (assignee_type === 'staff' || assignee_type === 'carer') {
      const { data: staff, error } = await supabase
        .from('staff')
        .select('auth_user_id')
        .eq('id', assignee_id)
        .single();

      if (error) {
        console.error('[create-form-assignment-notifications] Error fetching staff:', error);
      } else {
        authUserId = staff?.auth_user_id;
      }
    } else if (assignee_type === 'branch') {
      // For branch assignments, notify all staff in the branch
      console.log('[create-form-assignment-notifications] Branch assignment - fetching all branch staff');
      const { data: branchStaff, error } = await supabase
        .from('staff')
        .select('auth_user_id')
        .eq('branch_id', assignee_id)
        .eq('status', 'active')
        .not('auth_user_id', 'is', null);

      if (error) {
        console.error('[create-form-assignment-notifications] Error fetching branch staff:', error);
      } else if (branchStaff && branchStaff.length > 0) {
        // Create notifications for all branch staff
        const userIds = branchStaff.map(s => s.auth_user_id).filter(Boolean);
        
        // Verify profiles exist
        const { data: validProfiles } = await supabase
          .from('profiles')
          .select('id')
          .in('id', userIds);

        const validUserIds = validProfiles?.map(p => p.id) || [];

        if (validUserIds.length > 0) {
          const notifications = validUserIds.map(userId => ({
            user_id: userId,
            branch_id: branch_id,
            type: 'info',
            category: 'info',
            priority: 'low',
            title: 'New Form Assigned',
            message: `A new form has been assigned: ${form_title}`,
            data: JSON.stringify({
              form_id,
              notification_type: 'form_assignment'
            }),
            status: 'unread'
          }));

          const { data: inserted, error: insertError } = await supabase
            .from('notifications')
            .insert(notifications)
            .select();

          if (insertError) {
            console.error('[create-form-assignment-notifications] Error inserting branch notifications:', insertError);
            throw insertError;
          }

          console.log('[create-form-assignment-notifications] Created branch notifications:', inserted?.length);
          return new Response(
            JSON.stringify({ success: true, notifications_created: inserted?.length || 0 }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      return new Response(
        JSON.stringify({ success: true, notifications_created: 0, message: 'No valid branch staff to notify' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[create-form-assignment-notifications] Found auth_user_id:', authUserId);

    if (!authUserId) {
      console.log('[create-form-assignment-notifications] No auth_user_id found for assignee');
      return new Response(
        JSON.stringify({ success: true, notifications_created: 0, message: 'Assignee has no auth_user_id' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', authUserId)
      .single();

    if (profileError || !profile) {
      console.log('[create-form-assignment-notifications] No valid profile for user');
      return new Response(
        JSON.stringify({ success: true, notifications_created: 0, message: 'User has no valid profile' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create notification
    const notification = {
      user_id: authUserId,
      branch_id: branch_id,
      type: 'info',
      category: 'info',
      priority: 'low',
      title: 'New Form Assigned',
      message: `A new form has been assigned: ${form_title}`,
      data: JSON.stringify({
        form_id,
        notification_type: 'form_assignment'
      }),
      status: 'unread'
    };

    console.log('[create-form-assignment-notifications] Creating notification');

    const { data: insertedNotification, error: insertError } = await supabase
      .from('notifications')
      .insert([notification])
      .select();

    if (insertError) {
      console.error('[create-form-assignment-notifications] Error inserting notification:', insertError);
      throw insertError;
    }

    console.log('[create-form-assignment-notifications] Successfully created notification');

    return new Response(
      JSON.stringify({ success: true, notifications_created: 1 }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[create-form-assignment-notifications] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create notification', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
