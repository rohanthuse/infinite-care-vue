
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
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error('Method not allowed. Use POST.');
    }

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      throw new Error('Invalid JSON in request body');
    }

    const { clientId, password, adminId } = requestBody;

    // Validate required fields
    if (!clientId) {
      throw new Error('Client ID is required');
    }
    if (!password) {
      throw new Error('Password is required');
    }
    if (!adminId) {
      throw new Error('Admin ID is required');
    }

    console.log('[setup-client-auth] Processing request for client:', clientId);
    console.log('[setup-client-auth] Admin ID:', adminId);

    // Validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[setup-client-auth] Missing environment variables');
      throw new Error('Server configuration error');
    }

    // Create admin Supabase client with service role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get client information first
    console.log('[setup-client-auth] Fetching client information');
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, email, first_name, last_name, auth_user_id, branch_id')
      .eq('id', clientId)
      .single();

    if (clientError || !clientData) {
      console.error('[setup-client-auth] Client not found:', clientError);
      throw new Error('Client not found');
    }

    console.log('[setup-client-auth] Client found:', clientData.email);

    // Check admin permissions
    const { data: adminRoles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', adminId)
      .in('role', ['super_admin', 'branch_admin']);

    if (roleError || !adminRoles || adminRoles.length === 0) {
      console.error('[setup-client-auth] Insufficient permissions');
      throw new Error('Insufficient permissions');
    }

    let authUserId;
    let userCreated = false;

    try {
      console.log('[setup-client-auth] Attempting to create new user');
      
      // Try to create new user first - this avoids the listUsers() issue
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: clientData.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          first_name: clientData.first_name,
          last_name: clientData.last_name
        }
      });
      
      if (createError) {
        console.log('[setup-client-auth] Create failed, checking if user exists:', createError.message);
        
        // If user already exists, try to find and update them
        if (createError.message.includes('already registered') || createError.message.includes('User already registered')) {
          console.log('[setup-client-auth] User already exists, attempting to find and update');
          
          // Use the database function to link the client, which will handle finding the auth user
          const { data: linkResult, error: linkError } = await supabaseAdmin.rpc('link_client_to_auth_user', {
            p_client_id: clientId,
            p_auth_user_id: null, // Will be found by the function
            p_admin_id: adminId
          });

          if (linkError) {
            console.error('[setup-client-auth] Error with initial link attempt:', linkError);
          }

          // Try to get the auth user by email to update password
          const { data: authUsers, error: getUserError } = await supabaseAdmin
            .rpc('get_user_by_email', { user_email: clientData.email });
          
          // If that doesn't work, try a simpler approach by checking clients table
          if (getUserError || !authUsers) {
            console.log('[setup-client-auth] Could not find auth user, checking client record');
            
            // Check if client already has auth_user_id set
            const { data: clientCheck, error: clientCheckError } = await supabaseAdmin
              .from('clients')
              .select('auth_user_id')
              .eq('id', clientId)
              .single();
              
            if (clientCheck?.auth_user_id) {
              authUserId = clientCheck.auth_user_id;
              console.log('[setup-client-auth] Found auth_user_id in client record:', authUserId);
              
              // Update the password for existing user
              const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                authUserId,
                { password: password }
              );
              
              if (updateError) {
                console.error('[setup-client-auth] Error updating password:', updateError);
                throw new Error('Failed to update existing user password');
              }
              
              userCreated = false;
            } else {
              throw new Error('User exists but could not be found for update');
            }
          } else {
            authUserId = authUsers.id;
            console.log('[setup-client-auth] Found existing user:', authUserId);
            
            // Update existing user's password
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
              authUserId,
              { password: password }
            );
            
            if (updateError) {
              console.error('[setup-client-auth] Error updating user password:', updateError);
              throw new Error('Failed to update existing user password');
            }
            
            userCreated = false;
          }
        } else {
          console.error('[setup-client-auth] Unexpected error creating user:', createError);
          throw new Error(`Failed to create user: ${createError.message}`);
        }
      } else {
        authUserId = newUser.user.id;
        userCreated = true;
        console.log('[setup-client-auth] Successfully created new user:', authUserId);
      }

      // Ensure client role exists
      const { error: roleInsertError } = await supabaseAdmin
        .from('user_roles')
        .upsert({ 
          user_id: authUserId, 
          role: 'client' 
        }, { 
          onConflict: 'user_id,role' 
        });

      if (roleInsertError) {
        console.error('[setup-client-auth] Error inserting role:', roleInsertError);
        // Don't throw here as this is not critical
      }

      // Update client record with auth_user_id link
      const { error: clientUpdateError } = await supabaseAdmin
        .from('clients')
        .update({
          auth_user_id: authUserId,
          temporary_password: password,
          invitation_sent_at: new Date().toISOString(),
          password_set_by: adminId,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (clientUpdateError) {
        console.error('[setup-client-auth] Error updating client:', clientUpdateError);
        throw new Error(`Failed to link client to auth user: ${clientUpdateError.message}`);
      }

      console.log('[setup-client-auth] Client authentication setup completed successfully');

      // Return success response
      return new Response(
        JSON.stringify({
          success: true,
          message: userCreated 
            ? 'Client authentication created and linked successfully'
            : 'Client authentication updated and linked successfully',
          auth_user_id: authUserId,
          user_created: userCreated,
          client_linked: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } catch (authError: any) {
      console.error('[setup-client-auth] Authentication error:', authError);
      throw new Error(`Authentication setup failed: ${authError.message}`);
    }

  } catch (error: any) {
    console.error('[setup-client-auth] Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Return appropriate error response
    const isClientError = error.message.includes('required') || 
                         error.message.includes('Invalid') || 
                         error.message.includes('Method not allowed') ||
                         error.message.includes('Insufficient permissions') ||
                         error.message.includes('not found');

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
        type: isClientError ? 'validation_error' : 'server_error'
      }),
      {
        status: isClientError ? 400 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
