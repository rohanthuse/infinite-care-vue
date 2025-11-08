import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

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
    console.log('Starting create-organization-member function');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { email, password, firstName, lastName, role, permissions, organizationId } = await req.json();

    console.log('Request params:', { email, role, organizationId });

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role || !organizationId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: email, password, firstName, lastName, role, organizationId' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the current authenticated user (for invited_by)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user: currentUser }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !currentUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Current user:', currentUser.id);

    // Check if user already exists by email
    const { data: existingUsers, error: checkError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (checkError) {
      console.error('Error checking existing users:', checkError);
      throw checkError;
    }

    const existingUser = existingUsers.users.find(u => u.email === email);
    let userId: string;

    if (existingUser) {
      console.log('User already exists:', existingUser.id);
      userId = existingUser.id;

      // Check if they're already in this organization
      const { data: existingMember, error: memberCheckError } = await supabaseAdmin
        .from('organization_members')
        .select('id, status')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single();

      if (memberCheckError && memberCheckError.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error checking existing member:', memberCheckError);
        throw memberCheckError;
      }

      if (existingMember) {
        if (existingMember.status === 'active') {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'This user is already an active member of this organisation' 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // Reactivate inactive member
          console.log('Reactivating inactive member');
          
          const { error: updateError } = await supabaseAdmin
            .from('organization_members')
            .update({ 
              status: 'active',
              role: role,
              permissions: permissions,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingMember.id);

          if (updateError) {
            console.error('Error reactivating member:', updateError);
            throw updateError;
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Member reactivated successfully',
              userId: userId,
              reactivated: true
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // User exists but not in this organization - add them
      console.log('Adding existing user to organization');
      
    } else {
      // Create new user
      console.log('Creating new user');
      
      const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm, no email sent
        user_metadata: {
          first_name: firstName,
          last_name: lastName
        }
      });

      if (createUserError) {
        console.error('Error creating user:', createUserError);
        throw createUserError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      userId = authData.user.id;
      console.log('New user created:', userId);

      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          first_name: firstName,
          last_name: lastName,
          email: email
        });

      if (profileError && profileError.code !== '23505') { // Ignore duplicate key errors
        console.error('Error creating profile:', profileError);
        // Don't throw - profile might already exist
      }
    }

    // Use the database function to create organization member with proper role assignment
    const { data: memberId, error: memberError } = await supabaseAdmin.rpc(
      'create_organization_member_with_role',
      {
        p_organization_id: organizationId,
        p_user_id: userId,
        p_role: role,
        p_permissions: permissions,
        p_invited_by: currentUser.id,
      }
    );

    if (memberError) {
      console.error('Error creating organization member:', memberError);
      throw memberError;
    }

    console.log('Organization member created successfully:', memberId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Member added successfully',
        userId: userId,
        memberId: memberId,
        userCreated: !existingUser
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in create-organization-member:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to create organization member' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
