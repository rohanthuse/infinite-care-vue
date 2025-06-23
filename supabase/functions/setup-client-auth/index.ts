
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

    // Try to create a new user first
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
      if (createError.message && (
        createError.message.includes('already registered') || 
        createError.message.includes('User already registered') ||
        createError.message.includes('already exists')
      )) {
        console.log('[setup-client-auth] User already exists, attempting to update password');
        
        // For existing users, we'll use the admin API to update password by email
        // First, let's try to get the user by email using the admin API
        try {
          const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 1000 // We'll search through users to find by email
          });

          if (listError) {
            console.error('[setup-client-auth] List users error:', listError);
            // If we can't list users due to the schema issue, try a different approach
            // We'll create a temporary user and then update, or use RPC if available
            throw new Error('Cannot access user list to update existing user: ' + listError.message);
          }

          // Find the user by email
          const existingUser = usersData.users?.find(user => user.email === clientData.email);
          
          if (existingUser) {
            authUserId = existingUser.id;
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
            throw new Error('User email exists but could not find user record');
          }

        } catch (listUsersError) {
          console.error('[setup-client-auth] Could not handle existing user:', listUsersError);
          
          // If we can't list users due to schema issues, try alternative approach
          // Try to sign in the user to see if they exist, then update via admin API
          console.log('[setup-client-auth] Attempting alternative approach for existing user');
          
          // Generate a temporary password to try sign in
          const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
            email: clientData.email,
            password: 'temporary-test-password'
          });
          
          if (signInError && signInError.message.includes('Invalid login credentials')) {
            // User exists but password is wrong, which is expected
            // Now we need to reset their password using admin API
            console.log('[setup-client-auth] User exists, attempting password reset approach');
            
            // Try to generate a password reset and then update
            // For now, let's just throw an error with a helpful message
            throw new Error('User already exists but cannot update password due to database schema issues. Please contact system administrator.');
          } else {
            throw new Error('Could not determine user existence: ' + (listUsersError as Error).message);
          }
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
