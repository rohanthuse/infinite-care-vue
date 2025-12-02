import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgreementNotificationRequest {
  agreement_id: string;
  agreement_title: string;
  signer_auth_user_ids: string[];
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

    const { agreement_id, agreement_title, signer_auth_user_ids, branch_id }: AgreementNotificationRequest = await req.json();

    console.log('[create-agreement-notifications] Request received:', {
      agreement_id,
      agreement_title,
      signer_count: signer_auth_user_ids?.length || 0,
      branch_id
    });

    if (!agreement_id || !agreement_title || !branch_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: agreement_id, agreement_title, branch_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!signer_auth_user_ids || signer_auth_user_ids.length === 0) {
      console.log('[create-agreement-notifications] No signer auth_user_ids provided');
      return new Response(
        JSON.stringify({ success: true, notifications_created: 0, message: 'No signers to notify' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter out null/undefined values
    const validAuthUserIds = signer_auth_user_ids.filter(id => id != null && id !== '');
    console.log('[create-agreement-notifications] Valid auth_user_ids:', validAuthUserIds.length);

    if (validAuthUserIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, notifications_created: 0, message: 'No valid auth_user_ids' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify profiles exist for these users
    const { data: validProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .in('id', validAuthUserIds);

    if (profileError) {
      console.error('[create-agreement-notifications] Error verifying profiles:', profileError);
      throw profileError;
    }

    const validUserIds = validProfiles?.map(p => p.id) || [];
    console.log('[create-agreement-notifications] Valid profiles found:', validUserIds.length);

    if (validUserIds.length === 0) {
      console.log('[create-agreement-notifications] No users with valid profiles');
      return new Response(
        JSON.stringify({ success: true, notifications_created: 0, message: 'No users with valid profiles' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create notifications - using 'pending_agreement' type since it's in the valid types
    const notifications = validUserIds.map(userId => ({
      user_id: userId,
      branch_id: branch_id,
      type: 'pending_agreement',
      category: 'info',
      priority: 'medium',
      title: 'New Agreement Shared',
      message: `A new agreement has been shared: ${agreement_title}`,
      data: JSON.stringify({
        agreement_id,
        notification_type: 'agreement_assignment'
      }),
      status: 'unread'
    }));

    console.log('[create-agreement-notifications] Creating notifications:', notifications.length);

    const { data: insertedNotifications, error: insertError } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (insertError) {
      console.error('[create-agreement-notifications] Error inserting notifications:', insertError);
      throw insertError;
    }

    console.log('[create-agreement-notifications] Successfully created notifications:', insertedNotifications?.length);

    return new Response(
      JSON.stringify({
        success: true,
        notifications_created: insertedNotifications?.length || 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[create-agreement-notifications] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create notifications', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
