
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Generate a secure temporary password
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Check if a user already exists and is linked to the branch
async function isAlreadyAdminOfBranch(supabase: SupabaseClient, email: string, branchId: string): Promise<boolean> {
  const { data: user, error: userError } = await supabase.from('profiles').select('id').eq('email', email).single();

  if (userError || !user) {
    return false;
  }

  const { data: adminBranch, error: branchError } = await supabase
    .from('admin_branches')
    .select('*')
    .eq('admin_id', user.id)
    .eq('branch_id', branchId)
    .maybeSingle();

  return !!adminBranch;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, firstName, lastName, branchId, permissions } = await req.json()
    console.log('Received invite request for:', { email, firstName, lastName, branchId });

    if (!email || !firstName || !lastName || !branchId || !permissions) {
      console.error('Validation Error: Missing required fields.');
      return new Response(JSON.stringify({ error: 'Email, name, branch, and permissions are required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }
    
    if (await isAlreadyAdminOfBranch(supabaseAdmin, email, branchId)) {
        console.log(`Conflict: User ${email} is already an admin for branch ${branchId}.`);
        return new Response(JSON.stringify({ error: 'This user is already an administrator for this branch.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409,
        })
    }

    // Generate a temporary password
    const tempPassword = generateTemporaryPassword();
    console.log(`Generated temporary password for ${email}`);

    // Try to create a new user with admin privileges (bypasses email confirmation)
    console.log(`Attempting to create user ${email} via admin.createUser.`);
    const { data: createUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: 'branch_admin',
      },
    });

    let userId: string;

    if (createUserError) {
      console.error('Error during supabaseAdmin.auth.admin.createUser:', createUserError);
      
      if (createUserError.message.includes('User already exists')) {
        console.log(`User ${email} already exists. Attempting to link to branch ${branchId}.`);

        const { data: { users }, error: getUserError } = await supabaseAdmin.auth.admin.listUsers({ email });
        if (getUserError || users.length === 0) {
          console.error('Error fetching existing user by email:', getUserError);
          throw new Error("Failed to retrieve existing user after creation failed.");
        }
        
        const user = users[0];
        userId = user.id;
        console.log(`Found existing user with ID: ${userId}. Proceeding to link.`);
        
        // Update existing user's password and confirm email
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            first_name: firstName,
            last_name: lastName,
            role: 'branch_admin',
          }
        });
        
        if (updateError) {
          console.error('Error updating existing user:', updateError);
          throw updateError;
        }
      } else {
        throw createUserError;
      }
    } else {
      userId = createUserData.user.id;
      console.log(`New user ${email} created with ID: ${userId}.`);
    }

    // Ensure user has branch_admin role
    const { error: roleError } = await supabaseAdmin.from('user_roles').upsert({ 
      user_id: userId, 
      role: 'branch_admin' 
    });
    if (roleError) {
      console.error('Error upserting branch_admin role:', roleError);
      throw roleError;
    }

    // Link user to branch
    const { error: branchLinkError } = await supabaseAdmin.from('admin_branches').upsert({
      admin_id: userId,
      branch_id: branchId
    });
    if (branchLinkError) {
      console.error('Error linking user to branch:', branchLinkError);
      throw branchLinkError;
    }

    // Set permissions
    const { error: permissionsError } = await supabaseAdmin.from('admin_permissions').upsert({
      admin_id: userId,
      branch_id: branchId,
      ...permissions
    });
    if (permissionsError) {
      console.error('Error setting permissions:', permissionsError);
      throw permissionsError;
    }

    // Ensure profile exists
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: userId,
      email: email,
      first_name: firstName,
      last_name: lastName
    });
    if (profileError) {
      console.error('Error creating/updating profile:', profileError);
      // Don't throw here as this is not critical for login functionality
    }

    console.log(`Successfully invited ${email} and set up admin access.`);
    return new Response(JSON.stringify({ 
      message: `Admin invited successfully! Login credentials: Email: ${email}, Password: ${tempPassword}`,
      tempPassword: tempPassword 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
    
  } catch (error) {
    console.error('Unhandled exception in invite-admin function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
