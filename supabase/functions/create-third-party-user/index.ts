import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateThirdPartyUserRequest {
  requestId: string;
  email: string;
  fullName: string;
  password: string;
  accessExpiresAt?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requestId, email, fullName, password, accessExpiresAt } = await req.json() as CreateThirdPartyUserRequest;

    console.log('[create-third-party-user] Creating user for request:', requestId);

    if (!requestId || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: requestId, email, and password are required' }),
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

    // Hash the password using bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    console.log('[create-third-party-user] Password hashed successfully');

    // Check if user already exists for this request
    const { data: existingUser } = await supabase
      .from('third_party_users')
      .select('id')
      .eq('request_id', requestId)
      .single();

    let userId: string;

    if (existingUser) {
      // Update existing user with new password
      const { data: updatedUser, error: updateError } = await supabase
        .from('third_party_users')
        .update({
          email,
          full_name: fullName,
          password_hash: passwordHash,
          access_expires_at: accessExpiresAt || accessRequest.access_until,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('[create-third-party-user] Error updating user:', updateError);
        throw updateError;
      }

      userId = updatedUser.id;
      console.log('[create-third-party-user] User updated:', userId);
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('third_party_users')
        .insert({
          request_id: requestId,
          email,
          full_name: fullName,
          password_hash: passwordHash,
          access_expires_at: accessExpiresAt || accessRequest.access_until,
          is_active: true,
        })
        .select()
        .single();

      if (createError) {
        console.error('[create-third-party-user] Error creating user:', createError);
        throw createError;
      }

      userId = newUser.id;
      console.log('[create-third-party-user] User created:', userId);
    }

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
