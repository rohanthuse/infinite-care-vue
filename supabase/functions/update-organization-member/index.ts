import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting update-organization-member function');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { memberId, userId, firstName, lastName, email, organizationId } = await req.json();

    console.log('Update params:', { memberId, userId, organizationId });

    if (!memberId || !userId || !firstName || !lastName || !email || !organizationId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current authenticated user
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

    // Check if email already exists for another user
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .neq('id', userId)
      .single();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email already in use by another user' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        email: email
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      throw profileError;
    }

    // Update auth.users email if changed
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authUser.user && authUser.user.email !== email) {
      const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: email
      });

      if (emailError) {
        console.error('Error updating email:', emailError);
        // Don't throw - profile is updated, email sync can be retried
      }
    }

    // Update organization_members updated_at
    const { error: memberError } = await supabaseAdmin
      .from('organization_members')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', memberId);

    if (memberError) {
      console.error('Error updating member timestamp:', memberError);
    }

    console.log('Member updated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Member updated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in update-organization-member:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to update member' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
