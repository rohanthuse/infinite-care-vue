import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateAdminRequest {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  branch_ids: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify the caller is authenticated and is an admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is a super_admin or branch_admin
    const { data: userRoles, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['super_admin', 'branch_admin']);

    if (roleError || !userRoles || userRoles.length === 0) {
      console.error('User is not an admin:', roleError);
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { email, first_name, last_name, password, branch_ids }: CreateAdminRequest = await req.json();

    console.log('Creating branch admin:', { email, first_name, last_name, branch_count: branch_ids.length });

    // Create service role client for privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Step 1: Check if user already exists, create if not
    let newUserId: string;
    let isNewUser = false;

    // Find existing user by email using paginated search
    // listUsers() has a default limit of 50, so we need to search all pages
    let existingUser = null;
    let page = 1;
    const perPage = 100;

    console.log('Searching for existing user with email:', email);

    while (!existingUser) {
      const { data: usersPage, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (listError) {
        console.warn('Error listing users on page', page, ':', listError);
        break;
      }

      if (!usersPage?.users || usersPage.users.length === 0) {
        break;
      }

      existingUser = usersPage.users.find(u => u.email === email);

      if (usersPage.users.length < perPage) {
        break;
      }

      page++;

      // Safety limit to prevent infinite loops
      if (page > 50) {
        console.warn('Reached maximum page limit while searching for user');
        break;
      }
    }

    console.log('User lookup result:', { email, found: !!existingUser, pagesSearched: page });

    if (existingUser) {
      console.log('User already exists, using existing user:', existingUser.id);
      newUserId = existingUser.id;
    } else {
      // Create new user
      try {
        const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            first_name,
            last_name,
          },
        });

        if (createUserError) {
          // Check if error is because user already exists (race condition or pagination miss)
          if (createUserError.message?.includes('already been registered') || 
              (createUserError as any).code === 'email_exists') {
            console.log('User exists (caught at createUser), attempting direct lookup');
            
            // Try to find the user again with a fresh paginated search
            let foundUser = null;
            let searchPage = 1;
            while (!foundUser && searchPage <= 50) {
              const { data: searchResult } = await supabaseAdmin.auth.admin.listUsers({
                page: searchPage,
                perPage: 100,
              });
              
              if (!searchResult?.users || searchResult.users.length === 0) break;
              foundUser = searchResult.users.find(u => u.email === email);
              if (searchResult.users.length < 100) break;
              searchPage++;
            }
            
            if (foundUser) {
              newUserId = foundUser.id;
              isNewUser = false;
              console.log('Found existing user after retry:', newUserId);
            } else {
              throw new Error('User exists but could not be found. Please try again.');
            }
          } else {
            throw createUserError;
          }
        } else if (!authData?.user) {
          throw new Error('User creation returned no data');
        } else {
          newUserId = authData.user.id;
          isNewUser = true;
          console.log('User created successfully:', newUserId);
        }
      } catch (createError) {
        console.error('Failed to create/find user:', createError);
        return new Response(
          JSON.stringify({ error: `Failed to create user: ${(createError as Error).message || 'Unknown error'}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    try {
      // Step 2: Assign branch_admin role (upsert to handle existing users)
      const { error: roleAssignError } = await supabaseAdmin
        .from('user_roles')
        .upsert({
          user_id: newUserId,
          role: 'branch_admin',
        }, {
          onConflict: 'user_id,role'
        });

      if (roleAssignError) {
        console.error('Failed to assign role:', roleAssignError);
        throw new Error(`Failed to assign admin role: ${roleAssignError.message}`);
      }

      console.log('Role assigned successfully');

      // Step 3: Create admin-branch associations (upsert to handle existing associations)
      const branchAssociations = branch_ids.map(branchId => ({
        admin_id: newUserId,
        branch_id: branchId,
      }));

      const { error: branchAssocError } = await supabaseAdmin
        .from('admin_branches')
        .upsert(branchAssociations, {
          onConflict: 'admin_id,branch_id'
        });

      if (branchAssocError) {
        console.error('Failed to create branch associations:', branchAssocError);
        throw new Error(`Failed to create branch associations: ${branchAssocError.message}`);
      }

      console.log(`Branch associations created/updated for ${branch_ids.length} branches`);

      // Step 4: Get organization IDs and create organization memberships
      const { data: branchData, error: branchDataError } = await supabaseAdmin
        .from('branches')
        .select('organization_id')
        .in('id', branch_ids);

      if (branchDataError) {
        console.warn('Failed to get branch organization data:', branchDataError);
      } else if (branchData && branchData.length > 0) {
        const uniqueOrgIds = [...new Set(branchData.map(b => b.organization_id).filter(Boolean))];
        
        if (uniqueOrgIds.length > 0) {
          const orgMemberships = uniqueOrgIds.map(orgId => ({
            organization_id: orgId,
            user_id: newUserId,
            role: 'admin',
            status: 'active',
            joined_at: new Date().toISOString(),
          }));

          const { error: orgMemberError } = await supabaseAdmin
            .from('organization_members')
            .upsert(orgMemberships, {
              onConflict: 'organization_id,user_id'
            });

          if (orgMemberError) {
            console.warn('Organization membership creation warning:', orgMemberError);
          } else {
            console.log(`Organization memberships created/updated for ${uniqueOrgIds.length} organizations`);
          }
        }
      }

      // Step 5: Ensure profile exists
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', newUserId)
        .single();

      if (!existingProfile) {
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: newUserId,
            email,
            first_name,
            last_name,
          }, {
            onConflict: 'id'
          });

        if (profileError) {
          console.warn('Profile creation warning:', profileError);
        } else {
          console.log('Profile created/updated successfully');
        }
      }

      console.log('Branch admin setup completed successfully');

      // Step 6: Send welcome email (only for new users)
      if (isNewUser) {
        try {
          const emailResponse = await supabaseAdmin.functions.invoke('send-welcome-email', {
            body: {
              email,
              first_name,
              last_name,
              temporary_password: password,
              role: 'Branch Administrator',
            },
          });

          if (emailResponse.error) {
            console.warn('Failed to send welcome email:', emailResponse.error);
            // Don't fail the entire operation if email fails
          } else {
            console.log('Welcome email sent successfully');
          }
        } catch (emailError) {
          console.warn('Email sending error (non-fatal):', emailError);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          user_id: newUserId,
          message: isNewUser ? 'Branch admin created successfully' : 'Branch admin updated successfully',
          is_new_user: isNewUser,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      // Cleanup: Delete the user if any step fails (only for newly created users)
      console.error('Error during admin setup, attempting cleanup:', error);
      
      if (isNewUser) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(newUserId);
          console.log('User deleted during cleanup');
        } catch (deleteError) {
          console.error('Failed to delete user during cleanup:', deleteError);
        }
      }

      throw error;
    }

  } catch (error) {
    console.error('Error in create-branch-admin function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
