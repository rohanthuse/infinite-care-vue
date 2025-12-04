import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TenantAgreementNotificationRequest {
  agreement_id: string;
  agreement_title: string;
  organization_id: string;
  action_type: 'new' | 'updated';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { agreement_id, agreement_title, organization_id, action_type }: TenantAgreementNotificationRequest = await req.json();

    console.log('[create-tenant-agreement-notifications] Request:', {
      agreement_id,
      agreement_title,
      organization_id,
      action_type
    });

    if (!agreement_id || !agreement_title || !organization_id || !action_type) {
      console.error('[create-tenant-agreement-notifications] Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get organization members who are admins for this organization
    const { data: orgMembers, error: membersError } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', organization_id)
      .eq('role', 'admin')
      .eq('status', 'active');

    if (membersError) {
      console.error('[create-tenant-agreement-notifications] Error fetching org members:', membersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch organization members' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[create-tenant-agreement-notifications] Found org members:', orgMembers?.length || 0);

    if (!orgMembers || orgMembers.length === 0) {
      console.log('[create-tenant-agreement-notifications] No admin members found for organization');
      return new Response(
        JSON.stringify({ success: true, message: 'No admin members to notify', notifications_created: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create notification title and message based on action type
    const title = action_type === 'new' ? 'New Tenant Agreement' : 'Tenant Agreement Updated';
    const message = action_type === 'new' 
      ? `A new agreement "${agreement_title}" has been created for your organization.`
      : `The agreement "${agreement_title}" has been updated.`;

    // Create notifications for each admin member
    const notifications = orgMembers.map(member => ({
      user_id: member.user_id,
      organization_id: organization_id,
      branch_id: null, // Organization-level notification
      type: 'tenant_agreement',
      category: 'info',
      priority: action_type === 'new' ? 'high' : 'medium',
      title,
      message,
      data: {
        agreement_id,
        notification_type: 'tenant_agreement',
        action_type,
        navigate_to: '/agreement'
      }
    }));

    console.log('[create-tenant-agreement-notifications] Creating notifications:', notifications.length);

    const { data: insertedNotifications, error: insertError } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (insertError) {
      console.error('[create-tenant-agreement-notifications] Error inserting notifications:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create notifications' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[create-tenant-agreement-notifications] Successfully created notifications:', insertedNotifications?.length || 0);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notifications_created: insertedNotifications?.length || 0 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[create-tenant-agreement-notifications] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
