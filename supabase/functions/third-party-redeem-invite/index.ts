import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RedeemInviteRequest {
  token: string;
  userId: string;
  userEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, userId, userEmail }: RedeemInviteRequest = await req.json();

    console.log('[third-party-redeem-invite] Processing token redemption for:', { userId, userEmail, token: token.substring(0, 8) + '...' });

    // Initialize Supabase client
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find and validate the invitation
    const { data: request, error: requestError } = await supabase
      .from('third_party_access_requests')
      .select(`
        *,
        branches:branch_id (id, name, organization_id)
      `)
      .eq('invite_token', token)
      .eq('status', 'approved')
      .single();

    if (requestError || !request) {
      console.error('[third-party-redeem-invite] Request not found or invalid:', requestError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired invitation token' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email matches
    if (request.email !== userEmail) {
      console.error('[third-party-redeem-invite] Email mismatch:', { requestEmail: request.email, userEmail });
      return new Response(
        JSON.stringify({ error: 'Email address does not match the invitation' }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate access window
    const now = new Date();
    const accessFrom = new Date(request.access_from);
    const accessUntil = request.access_until ? new Date(request.access_until) : null;

    if (now < accessFrom) {
      return new Response(
        JSON.stringify({ error: 'Access period has not started yet' }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (accessUntil && now > accessUntil) {
      return new Response(
        JSON.stringify({ error: 'Access period has expired' }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create or update third-party user record
    const { data: thirdPartyUser, error: userError } = await supabase
      .from('third_party_users')
      .upsert({
        access_request_id: request.id,
        auth_user_id: userId,
        branch_id: request.branch_id,
        organization_id: request.branches?.organization_id,
        email: userEmail,
        first_name: request.first_name,
        last_name: request.surname,
        company_name: request.company_name,
        access_scope: request.request_for,
        access_expires_at: accessUntil?.toISOString(),
        is_active: true,
        updated_at: now.toISOString()
      }, {
        onConflict: 'access_request_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (userError) {
      console.error('[third-party-redeem-invite] Error creating third-party user:', userError);
      return new Response(
        JSON.stringify({ error: 'Failed to activate third-party access' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create session record
    const sessionToken = crypto.randomUUID();
    const { error: sessionError } = await supabase
      .from('third_party_sessions')
      .insert({
        third_party_user_id: thirdPartyUser.id,
        session_token: sessionToken,
        started_at: now.toISOString(),
        last_activity_at: now.toISOString(),
        is_active: true
      });

    if (sessionError) {
      console.error('[third-party-redeem-invite] Error creating session:', sessionError);
    }

    // Mark invitation as redeemed
    await supabase
      .from('third_party_access_requests')
      .update({ 
        invite_redeemed_at: now.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', request.id);

    console.log('[third-party-redeem-invite] Successfully redeemed invitation for:', userEmail);

    return new Response(
      JSON.stringify({
        success: true,
        thirdPartyUser,
        sessionToken,
        branchInfo: request.branches,
        accessScope: request.request_for,
        accessExpiresAt: accessUntil?.toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error: any) {
    console.error("Error in third-party-redeem-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
};

serve(handler);