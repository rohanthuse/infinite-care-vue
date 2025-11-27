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

    // Create Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

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

    console.log('[create-third-party-user] Access request details:', {
      requestFor: accessRequest.request_for,
      branchId: accessRequest.branch_id,
      accessUntil: accessRequest.access_until
    });

    // Check if user already exists in Supabase Auth
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let authUserId: string;

    if (existingUser) {
      console.log('[create-third-party-user] User already exists in Supabase Auth:', existingUser.id);
      authUserId = existingUser.id;
      
      // Update password for existing user
      const { error: updateError } = await supabase.auth.admin.updateUserById(authUserId, {
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: surname,
          is_third_party_access: true
        }
      });

      if (updateError) {
        console.error('[create-third-party-user] Error updating existing user:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update existing user: ' + updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Create new user in Supabase Auth
      console.log('[create-third-party-user] Creating new Supabase Auth user');
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email for third-party users
        user_metadata: {
          first_name: firstName,
          last_name: surname,
          is_third_party_access: true
        }
      });

      if (authError) {
        console.error('[create-third-party-user] Error creating Supabase Auth user:', authError);
        return new Response(
          JSON.stringify({ error: 'Failed to create auth user: ' + authError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      authUserId = authData.user.id;
      console.log('[create-third-party-user] Created Supabase Auth user:', authUserId);
    }

    // Create client or staff record based on access type
    const accessType = accessRequest.request_for;
    const branchId = accessRequest.branch_id;
    
    if (accessType === 'client') {
      // Check if client record already exists for this auth user
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('auth_user_id', authUserId)
        .maybeSingle();

      if (!existingClient) {
        console.log('[create-third-party-user] Creating client record');
        const { error: clientError } = await supabase
          .from('clients')
          .insert({
            auth_user_id: authUserId,
            first_name: firstName,
            last_name: surname,
            email,
            branch_id: branchId,
            status: 'Active',
            is_third_party_access: true
          });

        if (clientError) {
          console.error('[create-third-party-user] Error creating client record:', clientError);
          // Don't fail - the auth user is created, this is secondary
        } else {
          console.log('[create-third-party-user] Client record created');
        }
      } else {
        console.log('[create-third-party-user] Client record already exists:', existingClient.id);
      }
    } else if (accessType === 'staff') {
      // Check if staff record already exists for this auth user
      const { data: existingStaff } = await supabase
        .from('staff')
        .select('id')
        .eq('auth_user_id', authUserId)
        .maybeSingle();

      if (!existingStaff) {
        console.log('[create-third-party-user] Creating staff record');
        const { error: staffError } = await supabase
          .from('staff')
          .insert({
            auth_user_id: authUserId,
            first_name: firstName,
            last_name: surname,
            email,
            branch_id: branchId,
            status: 'Active',
            is_third_party_access: true
          });

        if (staffError) {
          console.error('[create-third-party-user] Error creating staff record:', staffError);
          // Don't fail - the auth user is created, this is secondary
        } else {
          console.log('[create-third-party-user] Staff record created');
        }
      } else {
        console.log('[create-third-party-user] Staff record already exists:', existingStaff.id);
      }
    }

    // Create or update third_party_users record with auth_user_id for expiry tracking
    const { data: existingThirdPartyUser } = await supabase
      .from('third_party_users')
      .select('id')
      .eq('request_id', requestId)
      .maybeSingle();

    if (existingThirdPartyUser) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('third_party_users')
        .update({
          auth_user_id: authUserId,
          email,
          first_name: firstName,
          surname,
          access_expires_at: accessExpiresAt || accessRequest.access_until,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingThirdPartyUser.id);

      if (updateError) {
        console.error('[create-third-party-user] Error updating third_party_users:', updateError);
      }
    } else {
      // Create new record
      const { error: insertError } = await supabase
        .from('third_party_users')
        .insert({
          request_id: requestId,
          branch_id: branchId,
          auth_user_id: authUserId,
          email,
          first_name: firstName,
          surname,
          access_scope: accessType,
          access_expires_at: accessExpiresAt || accessRequest.access_until,
          is_active: true
        });

      if (insertError) {
        console.error('[create-third-party-user] Error creating third_party_users record:', insertError);
      }
    }

    console.log('[create-third-party-user] User setup completed successfully:', authUserId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: authUserId,
        accessType,
        message: 'Third-party user created successfully. User can now login at /login' 
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
