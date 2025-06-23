
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

    // Check if auth user already exists
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('[setup-client-auth] Error listing users:', listError);
      throw new Error('Failed to check existing users');
    }

    let existingUser = null;
    if (existingUsers && existingUsers.users && Array.isArray(existingUsers.users)) {
      existingUser = existingUsers.users.find((u: any) => u && u.email === clientData.email) || null;
    }

    let authUserId;

    if (existingUser) {
      // Update existing user's password
      console.log('[setup-client-auth] Updating existing user:', existingUser.id);
      const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password }
      );

      if (updateError) {
        console.error('[setup-client-auth] Password update error:', updateError);
        throw new Error('Failed to update user password');
      }

      authUserId = existingUser.id;
    } else {
      // Create new auth user
      console.log('[setup-client-auth] Creating new auth user for:', clientData.email);
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
        console.error('[setup-client-auth] User creation error:', createError);
        throw new Error('Failed to create auth user: ' + createError.message);
      }

      authUserId = createData.user?.id;
      console.log('[setup-client-auth] Created new auth user:', authUserId);

      // Assign client role
      if (authUserId) {
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({ user_id: authUserId, role: 'client' });

        if (roleError) {
          console.warn('[setup-client-auth] Role assignment warning:', roleError);
        }
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
    }

    console.log('[setup-client-auth] Successfully set up authentication for client');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Client authentication setup successfully',
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
