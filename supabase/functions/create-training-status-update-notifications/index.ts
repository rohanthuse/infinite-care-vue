import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-system-session-token',
};

interface TrainingStatusUpdatePayload {
  staff_id: string;
  staff_name: string;
  training_title: string;
  new_status: string;
  branch_id: string;
  training_record_id: string;
}

const STATUS_DISPLAY_NAMES: Record<string, string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  'completed': 'Completed',
  'paused': 'Paused',
  'under-review': 'Under Review',
  'failed': 'Failed',
  'renewal-required': 'Renewal Required',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: TrainingStatusUpdatePayload = await req.json();
    
    console.log('Received training status update notification request:', payload);

    const { staff_id, staff_name, training_title, new_status, branch_id, training_record_id } = payload;

    // Validate required fields
    if (!staff_id || !staff_name || !training_title || !new_status || !branch_id) {
      console.error('Missing required fields:', { staff_id, staff_name, training_title, new_status, branch_id });
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all branch admins for this branch
    const { data: adminBranches, error: adminError } = await supabase
      .from('admin_branches')
      .select('admin_id')
      .eq('branch_id', branch_id);

    if (adminError) {
      console.error('Error fetching branch admins:', adminError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch branch admins', details: adminError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!adminBranches || adminBranches.length === 0) {
      console.log('No admins found for branch:', branch_id);
      return new Response(
        JSON.stringify({ success: true, message: 'No admins to notify', notifications_created: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${adminBranches.length} admins for branch ${branch_id}`);

    // Fetch organization_id from branch for proper notification separation
    let branchOrganizationId: string | null = null;
    const { data: branchData, error: branchOrgError } = await supabase
      .from('branches')
      .select('organization_id')
      .eq('id', branch_id)
      .single();

    if (branchOrgError) {
      console.warn('Error fetching branch organization:', branchOrgError);
    } else {
      branchOrganizationId = branchData?.organization_id || null;
    }
    console.log('Branch organization_id:', branchOrganizationId);

    // Format status for display
    const statusDisplay = STATUS_DISPLAY_NAMES[new_status] || new_status;
    const updatedAt = new Date().toISOString();

    // Create notifications for each admin
    const notifications = adminBranches.map(({ admin_id }) => ({
      user_id: admin_id,
      branch_id,
      organization_id: branchOrganizationId,
      type: 'training',
      category: 'info',
      priority: 'medium',
      title: 'Training Status Updated',
      message: `${staff_name} updated "${training_title}" status to ${statusDisplay}`,
      data: {
        notification_type: 'training_status_update',
        staff_id,
        staff_name,
        training_title,
        training_record_id,
        new_status,
        status_display: statusDisplay,
        branch_id,
        updated_at: updatedAt,
      },
    }));

    const { data: insertedNotifications, error: insertError } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (insertError) {
      console.error('Error inserting notifications:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create notifications', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully created ${insertedNotifications?.length || 0} notifications`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notifications_created: insertedNotifications?.length || 0,
        admin_ids: adminBranches.map(a => a.admin_id)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
