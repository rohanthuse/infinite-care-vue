import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LibraryResourceNotificationRequest {
  resource_id: string;
  resource_title: string;
  branch_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { resource_id, resource_title, branch_id }: LibraryResourceNotificationRequest = await req.json();

    console.log('Creating library resource notifications:', { resource_id, resource_title, branch_id });

    if (!resource_id || !resource_title || !branch_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: resource_id, resource_title, branch_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch active clients with auth_user_id in this branch
    const { data: clients, error: clientsError } = await supabaseAdmin
      .from('clients')
      .select('auth_user_id')
      .eq('branch_id', branch_id)
      .eq('status', 'Active')
      .not('auth_user_id', 'is', null);

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
    }

    console.log('Found active clients with auth:', clients?.length || 0);

    // Fetch active staff with auth_user_id in this branch
    const { data: staff, error: staffError } = await supabaseAdmin
      .from('staff')
      .select('auth_user_id')
      .eq('branch_id', branch_id)
      .eq('status', 'Active')
      .not('auth_user_id', 'is', null);

    if (staffError) {
      console.error('Error fetching staff:', staffError);
    }

    console.log('Found active staff with auth:', staff?.length || 0);

    // Combine unique user IDs
    const clientUserIds = clients?.map(c => c.auth_user_id).filter(Boolean) || [];
    const staffUserIds = staff?.map(s => s.auth_user_id).filter(Boolean) || [];
    const allUserIds = [...new Set([...clientUserIds, ...staffUserIds])];

    console.log('Total unique users to notify:', allUserIds.length);

    if (allUserIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No eligible users to notify',
          notifications_created: 0 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify users exist in profiles table
    const { data: validProfiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .in('id', allUserIds);

    if (profilesError) {
      console.error('Error verifying profiles:', profilesError);
    }

    const validUserIds = validProfiles?.map(p => p.id) || [];
    console.log('Valid users with profiles:', validUserIds.length);

    if (validUserIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No users with valid profiles to notify',
          notifications_created: 0 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create notifications for each valid user
    const notifications = validUserIds.map(userId => ({
      user_id: userId,
      branch_id: branch_id,
      type: 'info',
      category: 'info',
      priority: 'low',
      title: 'New Library Resource',
      message: `A new resource has been added to your Library: ${resource_title}`,
      data: {
        resource_id: resource_id,
        resource_title: resource_title,
        notification_type: 'library_resource'
      },
    }));

    console.log('Inserting notifications:', notifications.length);

    // Batch insert notifications
    const { data: insertedNotifications, error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert(notifications)
      .select('id');

    if (insertError) {
      console.error('Error inserting notifications:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create notifications', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully created notifications:', insertedNotifications?.length || 0);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notifications created successfully',
        notifications_created: insertedNotifications?.length || 0,
        clients_notified: clientUserIds.filter(id => validUserIds.includes(id)).length,
        staff_notified: staffUserIds.filter(id => validUserIds.includes(id)).length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-library-resource-notifications:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
