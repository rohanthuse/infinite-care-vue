import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateThirdPartyUserRequest {
  requestId: string;
  email: string;
  firstName: string;
  surname: string;
  password: string;
  accessExpiresAt?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requestId, email, firstName, surname, password, accessExpiresAt } = await req.json() as CreateThirdPartyUserRequest;

    console.log('[create-third-party-user] Creating user for request:', requestId);

    if (!requestId || !email || !password || !firstName || !surname) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: requestId, email, firstName, surname, and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the access request exists and is approved
    const { data: accessRequest, error: requestError } = await supabase
      .from('third_party_access_requests')
      .select('*')
      .eq('id', requestId)
      .eq('status', 'approved')
      .single();

    if (requestError || !accessRequest) {
      console.error('[create-third-party-user] Access request not found or not approved:', requestError);
      return new Response(
        JSON.stringify({ error: 'Access request not found or not approved' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user using the database function that handles password hashing
    const { data: userId, error: createError } = await supabase.rpc('create_third_party_user_with_password', {
      p_request_id: requestId,
      p_email: email,
      p_first_name: firstName,
      p_surname: surname,
      p_password: password,
      p_access_expires_at: accessExpiresAt || accessRequest.access_until
    });

    if (createError) {
      console.error('[create-third-party-user] Error creating user:', createError);
      return new Response(
        JSON.stringify({ error: createError.message || 'Failed to create user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[create-third-party-user] User created successfully:', userId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId,
        message: 'Third-party user created successfully' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[create-third-party-user] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
