
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

    // Get client details
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('email, first_name, last_name')
      .eq('id', clientId)
      .single();

    if (clientError || !clientData) {
      console.error('[setup-client-auth] Client lookup error:', clientError);
      throw new Error('Client not found');
    }

    console.log('[setup-client-auth] Client found:', clientData.email);

    let authUserId;
    let userCreated = false;

    // Try to create a new user first - this avoids the problematic listUsers() call
    console.log('[setup-client-auth] Attempting to create new auth user for:', clientData.email);
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: clientData.email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: clientData.first_name,
        last_name: clientData.last_name,
        role: 'client'
      }
    });

    if (createError) {
      // Check if the error is because user already exists
      if (createError.message && createError.message.includes('already registered')) {
        console.log('[setup-client-auth] User already exists, attempting to update password');
        
        // User exists, we need to find them and update their password
        // We'll use a different approach to find the user by email through the database
        const { data: authUserData } = await supabaseAdmin
          .from('auth.users')
          .select('id')
          .eq('email', clientData.email)
          .single();

        if (authUserData) {
          authUserId = authUserData.id;
          console.log('[setup-client-auth] Found existing user:', authUserId);

          // Update existing user's password
          const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            authUserId,
            { password }
          );

          if (updateError) {
            console.error('[setup-client-auth] Password update error:', updateError);
            throw new Error('Failed to update user password: ' + updateError.message);
          }

          console.log('[setup-client-auth] Successfully updated password for existing user');
        } else {
          // If we can't find the user, throw the original error
          console.error('[setup-client-auth] User creation failed and cannot find existing user:', createError);
          throw new Error('Failed to create or find auth user: ' + createError.message);
        }
      } else {
        console.error('[setup-client-auth] User creation error:', createError);
        throw new Error('Failed to create auth user: ' + createError.message);
      }
    } else {
      // User was created successfully
      authUserId = createData.user?.id;
      userCreated = true;
      console.log('[setup-client-auth] Created new auth user:', authUserId);
    }

    // Assign client role if user was just created
    if (userCreated && authUserId) {
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: authUserId, role: 'client' });

      if (roleError) {
        console.warn('[setup-client-auth] Role assignment warning:', roleError);
        // Don't fail the entire operation for role assignment issues
      } else {
        console.log('[setup-client-auth] Successfully assigned client role');
      }
    }

    // Update client record with password info
    const { error: updateClientError } = await supabaseAdmin
      .from('clients')
      .update({
        temporary_password: password,
        invitation_sent_at: new Date().toISOString(),
        password_set_by: adminId
      })
      .eq('id', clientId);

    if (updateClientError) {
      console.warn('[setup-client-auth] Client record update warning:', updateClientError);
      // Don't fail the entire operation for client record update issues
    } else {
      console.log('[setup-client-auth] Successfully updated client record');
    }

    console.log('[setup-client-auth] Successfully set up authentication for client');

    return new Response(
      JSON.stringify({
        success: true,
        message: userCreated ? 'Client authentication created successfully' : 'Client authentication updated successfully',
        auth_user_id: authUserId
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
