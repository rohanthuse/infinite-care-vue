import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-system-session-token',
};

interface RenewalRequest {
  session_token: string;
  organization_id: string;
  plan_id?: string;
  duration_months: number;
  notes?: string;
}

serve(async (req) => {
  console.log('[renew-subscription] Request received:', req.method);
  console.log('[renew-subscription] Origin:', req.headers.get('origin'));
  console.log('[renew-subscription] Access-Control-Request-Headers:', req.headers.get('access-control-request-headers'));
  
  // Handle CORS preflight with proper 204 response
  if (req.method === 'OPTIONS') {
    console.log('[renew-subscription] Handling CORS preflight - returning 204');
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: RenewalRequest = await req.json();
    const { session_token, organization_id, plan_id, duration_months, notes } = body;

    console.log('[renew-subscription] Processing renewal:', { organization_id, duration_months });

    // Verify system session token
    console.log('[renew-subscription] Validating session token...');
    const { data: sessionData, error: sessionError } = await supabase
      .from('system_sessions')
      .select('user_id, expires_at')
      .eq('session_token', session_token)
      .maybeSingle();

    if (sessionError) {
      console.error('[renew-subscription] Session query error:', sessionError);
      return new Response(
        JSON.stringify({ success: false, error: 'Session validation failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    if (!sessionData) {
      console.error('[renew-subscription] No session found for token');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid session token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    if (new Date(sessionData.expires_at) < new Date()) {
      console.error('[renew-subscription] Session expired:', sessionData.expires_at);
      return new Response(
        JSON.stringify({ success: false, error: 'Session token expired - please sign in again' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log('[renew-subscription] Session valid for user:', sessionData.user_id);

    // Get current organization data
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('subscription_expires_at, subscription_plan_id, subscription_status')
      .eq('id', organization_id)
      .single();

    if (orgError || !org) {
      throw new Error('Organization not found');
    }

    // Calculate new expiry date
    const currentExpiry = org.subscription_expires_at 
      ? new Date(org.subscription_expires_at) 
      : new Date();
    
    // If already expired, start from today, otherwise extend from current expiry
    const startDate = currentExpiry < new Date() ? new Date() : currentExpiry;
    const newExpiry = new Date(startDate);
    newExpiry.setMonth(newExpiry.getMonth() + duration_months);

    // Update organization
    const updateData: any = {
      subscription_expires_at: newExpiry.toISOString(),
      subscription_status: 'active',
      updated_at: new Date().toISOString(),
    };

    // Update plan if provided
    if (plan_id && plan_id !== org.subscription_plan_id) {
      updateData.subscription_plan_id = plan_id;
    }

    const { error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', organization_id);

    if (updateError) {
      console.error('[renew-subscription] Update error:', updateError);
      throw updateError;
    }

    // Log renewal action
    try {
      await supabase.from('system_audit_logs').insert({
        action_type: 'subscription_renewed',
        entity_type: 'organization',
        entity_id: organization_id,
        performed_by: sessionData.user_id,
        details: {
          previous_expiry: org.subscription_expires_at,
          new_expiry: newExpiry.toISOString(),
          duration_months,
          notes,
          plan_updated: plan_id && plan_id !== org.subscription_plan_id,
        },
        created_at: new Date().toISOString(),
      });
    } catch (auditError) {
      console.error('[renew-subscription] Audit log error:', auditError);
      // Continue even if audit log fails
    }

    console.log('[renew-subscription] Renewal successful');

    return new Response(
      JSON.stringify({
        success: true,
        new_expiry_date: newExpiry.toISOString(),
        message: 'Subscription renewed successfully',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('[renew-subscription] Edge function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
