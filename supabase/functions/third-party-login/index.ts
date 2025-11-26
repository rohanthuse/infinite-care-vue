import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LoginRequest {
  email: string;
  password: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json() as LoginRequest;

    console.log('[third-party-login] Login attempt for:', email);

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the authenticate function
    const { data: authResult, error: authError } = await supabase
      .rpc('authenticate_third_party_user', {
        p_email: email,
        p_password: password,
      });

    if (authError) {
      console.error('[third-party-login] Auth RPC error:', authError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[third-party-login] Auth result:', authResult);

    if (!authResult.success) {
      console.log('[third-party-login] Auth failed:', authResult.error);
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get branch info for the workspace
    const { data: branchInfo, error: branchError } = await supabase
      .from('branches')
      .select('id, name, organization_id, organizations(slug, name)')
      .eq('id', authResult.user.branch_id)
      .single();

    if (branchError) {
      console.error('[third-party-login] Error fetching branch info:', branchError);
    }

    console.log('[third-party-login] Login successful for user:', authResult.user.id);

    return new Response(
      JSON.stringify({
        success: true,
        sessionToken: authResult.session_token,
        user: {
          id: authResult.user.id,
          email: authResult.user.email,
          fullName: authResult.user.full_name,
          accessScope: authResult.user.access_scope,
          branchId: authResult.user.branch_id,
          branchName: authResult.user.branch_name,
          organizationId: authResult.user.organization_id,
          accessExpiresAt: authResult.user.access_expires_at,
        },
        branchInfo: branchInfo ? {
          id: branchInfo.id,
          name: branchInfo.name,
          organizationId: branchInfo.organization_id,
          organizationSlug: branchInfo.organizations?.slug,
          organizationName: branchInfo.organizations?.name,
        } : null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[third-party-login] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
