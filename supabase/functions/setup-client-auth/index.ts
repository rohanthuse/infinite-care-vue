
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
        console.log('[setup-client-auth] User already exists, attempting to find and update password');
        
        // Try to get user by email using the admin getUserByEmail method (if available)
        // If not available, we'll use a different approach
        try {
          // First try to update by email - this is a simpler approach
          console.log('[setup-client-auth] Attempting to update existing user password by email');
          
          // Use the admin updateUserByEmail method if available, otherwise fall back to creating temp user approach
          const { data: getUserData, error: getUserError } = await supabaseAdmin.auth.admin.getUserByEmail?.(clientData.email) || 
            await supabaseAdmin.rpc('get_user_by_email', { user_email: clientData.email }).catch(() => ({ data: null, error: null }));

          if (getUserData && getUserData.user) {
            authUserId = getUserData.user.id;
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
            // If we can't find the user by email, try alternative approach
            // Create a temporary user to get the auth user ID, then delete and recreate properly
            console.log('[setup-client-auth] Could not find user by email, using alternative approach');
            
            // Generate a temporary email to create a new user and get an ID
            const tempEmail = `temp_${Date.now()}_${Math.random()}@temp.local`;
            const { data: tempUserData, error: tempUserError } = await supabaseAdmin.auth.admin.createUser({
              email: tempEmail,
              password: 'temp_password',
              email_confirm: true
            });

            if (tempUserData?.user) {
              authUserId = tempUserData.user.id;
              
              // Now update this user with the correct email and password
              const { error: finalUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
                authUserId,
                { 
                  email: clientData.email,
                  password,
                  user_metadata: {
                    first_name: clientData.first_name,
                    last_name: clientData.last_name,
                    role: 'client'
                  }
                }
              );

              if (finalUpdateError) {
                // Clean up the temp user
                await supabaseAdmin.auth.admin.deleteUser(authUserId);
                throw new Error('Failed to update user with correct credentials: ' + finalUpdateError.message);
              }

              console.log('[setup-client-auth] Successfully created and updated user via alternative method');
            } else {
              throw new Error('Could not create temporary user for update: ' + (tempUserError?.message || 'Unknown error'));
            }
          }

        } catch (alternativeError) {
          console.error('[setup-client-auth] Alternative user handling failed:', alternativeError);
          throw new Error('User already exists but cannot update password. Please contact system administrator.');
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
