
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// This function checks if a user already exists and is linked to the branch.
async function isAlreadyAdminOfBranch(supabase: SupabaseClient, email: string, branchId: string): Promise<boolean> {
  const { data: user, error: userError } = await supabase.from('profiles').select('id').eq('email', email).single();

  if (userError || !user) {
    // User does not exist, so not an admin of the branch
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

    const { email, firstName, lastName, branchId } = await req.json()
    console.log('Received invite request for:', { email, firstName, lastName, branchId });

    if (!email || !firstName || !lastName || !branchId) {
      console.error('Validation Error: Missing required fields.');
      return new Response(JSON.stringify({ error: 'Email, name, and branch are required.' }), {
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

    console.log(`Attempting to invite ${email} via auth.admin.inviteUserByEmail.`);
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        first_name: firstName,
        last_name: lastName,
        role: 'branch_admin',
      },
    })

    if (inviteError) {
      console.error('Error during supabaseAdmin.auth.admin.inviteUserByEmail:', inviteError);
      if (inviteError.message.includes('User already exists')) {
        console.log(`User ${email} already exists. Attempting to link to branch ${branchId}.`);

        const { data: { users }, error: getUserError } = await supabaseAdmin.auth.admin.listUsers({ email });
        if (getUserError || users.length === 0) {
          console.error('Error fetching existing user by email:', getUserError);
          throw new Error("Failed to retrieve existing user after invite failed.");
        }
        
        const user = users[0];
        console.log(`Found existing user with ID: ${user.id}. Proceeding to link.`);
        
        const { error: branchLinkError } = await supabaseAdmin.from('admin_branches').insert({
            admin_id: user.id,
            branch_id: branchId
        });
        if (branchLinkError) {
          console.error('Error linking existing user to branch in admin_branches:', branchLinkError);
          throw branchLinkError;
        }
        
        const { error: roleError } = await supabaseAdmin.from('user_roles').upsert({ user_id: user.id, role: 'branch_admin' });
        if (roleError) {
          console.error('Error upserting branch_admin role for existing user:', roleError);
          throw roleError;
        }
        
        console.log(`Successfully linked existing user ${email} to branch.`);
        return new Response(JSON.stringify({ message: 'Existing user assigned as admin to the branch.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      throw inviteError
    }
    
    const newUser = inviteData.user
    if (!newUser) {
      console.error('Invite successful but newUser object is missing from response.');
      throw new Error('Could not get user from invitation.')
    }

    console.log(`New user ${email} invited with ID: ${newUser.id}. Linking to branch.`);
    const { error: branchLinkError } = await supabaseAdmin.from('admin_branches').insert({
      admin_id: newUser.id,
      branch_id: branchId,
    })

    if (branchLinkError) {
      console.error('Failed to link newly invited user to branch:', branchLinkError)
      throw new Error('User was invited, but could not be assigned to the branch.')
    }

    console.log(`Successfully invited ${email} and linked to branch.`);
    return new Response(JSON.stringify({ message: 'Admin invited successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Unhandled exception in invite-admin function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
