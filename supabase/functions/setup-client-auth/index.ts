
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, password, adminId } = await req.json();

    console.log('[setup-client-auth] Processing request for client:', clientId);

    // Create admin Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Use our safe database function instead of Auth Admin API
    console.log('[setup-client-auth] Calling safe_setup_client_auth function');
    const { data: result, error: functionError } = await supabaseAdmin
      .rpc('safe_setup_client_auth', {
        p_client_id: clientId,
        p_password: password,
        p_admin_id: adminId
      });

    if (functionError) {
      console.error('[setup-client-auth] Database function error:', functionError);
      throw new Error('Failed to setup client authentication: ' + functionError.message);
    }

    if (!result?.success) {
      console.error('[setup-client-auth] Setup failed:', result?.error);
      throw new Error(result?.error || 'Authentication setup failed');
    }

    console.log('[setup-client-auth] Successfully set up authentication for client');
    console.log('[setup-client-auth] Result:', result);

    return new Response(
      JSON.stringify({
        success: true,
        message: result.message || 'Client authentication set up successfully',
        auth_user_id: result.auth_user_id,
        user_created: result.user_created
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('[setup-client-auth] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
