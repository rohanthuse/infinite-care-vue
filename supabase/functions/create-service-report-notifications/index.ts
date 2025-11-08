import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  service_report_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role for privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { service_report_id }: NotificationRequest = await req.json();

    console.log('Processing notifications for service report:', service_report_id);

    // Fetch service report details with related data
    const { data: report, error: reportError } = await supabaseAdmin
      .from('client_service_reports')
      .select(`
        id,
        client_id,
        staff_id,
        branch_id,
        service_date,
        status,
        clients!inner(first_name, last_name),
        staff!inner(first_name, last_name)
      `)
      .eq('id', service_report_id)
      .single();

    if (reportError || !report) {
      console.error('Service report not found:', reportError);
      return new Response(
        JSON.stringify({ error: 'Service report not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only send notifications for pending reports
    if (report.status !== 'pending') {
      console.log('Report status is not pending, skipping notifications');
      return new Response(
        JSON.stringify({ message: 'Notifications skipped for non-pending report' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all admins for this branch
    const { data: admins, error: adminsError } = await supabaseAdmin
      .from('admin_branches')
      .select('admin_id')
      .eq('branch_id', report.branch_id);

    if (adminsError || !admins || admins.length === 0) {
      console.error('No admins found for branch:', adminsError);
      return new Response(
        JSON.stringify({ error: 'No admins found for branch' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${admins.length} admins to notify`);

    // Build notification data
    const staffName = `${report.staff.first_name} ${report.staff.last_name}`;
    const clientName = `${report.clients.first_name} ${report.clients.last_name}`;

    // Verify which admins exist in auth.users (batch check)
    const adminIds = admins.map(a => a.admin_id);
    const { data: validAdmins, error: authCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .in('id', adminIds);

    if (authCheckError) {
      console.warn('Error checking admin auth status:', authCheckError);
      // Continue anyway, individual checks will happen during insert
    }

    const validAdminIds = validAdmins ? validAdmins.map(a => a.id) : adminIds;

    // Batch insert notifications for all valid admins
    const notifications = validAdminIds.map(adminId => ({
      user_id: adminId,
      branch_id: report.branch_id,
      type: 'service_report',
      category: 'info',
      priority: 'high',
      title: 'New Service Report Submitted',
      message: `${staffName} submitted a service report for ${clientName}`,
      data: {
        service_report_id: report.id,
        client_id: report.client_id,
        staff_id: report.staff_id,
        service_date: report.service_date,
      },
    }));

    const { data: insertedNotifications, error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert(notifications)
      .select('id');

    if (insertError) {
      console.error('Failed to insert notifications:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create notifications', details: insertError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully created ${insertedNotifications?.length || 0} notifications`);

    return new Response(
      JSON.stringify({
        success: true,
        notifications_created: insertedNotifications?.length || 0,
        admins_notified: validAdminIds.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-service-report-notifications:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
