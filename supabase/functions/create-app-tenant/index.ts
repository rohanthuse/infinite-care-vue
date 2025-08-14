// Edge function to create new tenants with auto Super Admin assignment
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateTenantRequest {
  name: string;
  slug: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
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

    // Parse request body
    const requestData: CreateTenantRequest = await req.json();
    console.log('[create-app-tenant] Request data:', requestData);

    // Validate required fields
    if (!requestData.name || !requestData.slug || !requestData.contactEmail) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: name, slug, and contactEmail are required' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if slug already exists
    const { data: existingOrg, error: checkError } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('slug', requestData.slug.toLowerCase())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[create-app-tenant] Error checking existing slug:', checkError);
      return new Response(
        JSON.stringify({ error: 'Database error while checking slug availability' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingOrg) {
      return new Response(
        JSON.stringify({ error: 'Slug already exists. Please choose a different slug.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create organization
    const orgData = {
      name: requestData.name,
      slug: requestData.slug.toLowerCase(),
      subdomain: requestData.slug.toLowerCase(), // Use slug as subdomain
      contact_email: requestData.contactEmail,
      contact_phone: requestData.contactPhone || null,
      address: requestData.address || null,
      logo_url: requestData.logoUrl || null,
      primary_color: requestData.primaryColor || '#1E40AF',
      secondary_color: requestData.secondaryColor || '#F3F4F6',
      subscription_status: 'active',
      subscription_plan: 'basic',
    };

    console.log('[create-app-tenant] Creating organization:', orgData);

    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert(orgData)
      .select()
      .single();

    if (orgError) {
      console.error('[create-app-tenant] Error creating organization:', orgError);
      return new Response(
        JSON.stringify({ error: 'Failed to create organization: ' + orgError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[create-app-tenant] Organization created:', organization);

    // Find or create user for the contact email
    let userId: string | null = null;

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser?.users?.find(u => u.email === requestData.contactEmail);

    if (userExists) {
      userId = userExists.id;
      console.log('[create-app-tenant] Using existing user:', userId);
    } else {
      // Create new user
      const tempPassword = `Temp${Math.random().toString(36).slice(2)}!`;
      const { data: newUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: requestData.contactEmail,
        password: tempPassword,
        email_confirm: true,
      });

      if (userError) {
        console.error('[create-app-tenant] Error creating user:', userError);
        // Continue without failing - organization is created
      } else {
        userId = newUser.user.id;
        console.log('[create-app-tenant] Created new user:', userId);
      }
    }

    // Assign Super Admin role if user was created/found
    if (userId) {
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'super_admin'
        });

      if (roleError && roleError.code !== '23505') { // Ignore duplicate key errors
        console.error('[create-app-tenant] Error assigning super admin role:', roleError);
      } else {
        console.log('[create-app-tenant] Assigned super admin role to user:', userId);
      }

      // Add user to organization as owner
      const { error: memberError } = await supabaseAdmin
        .from('organization_members')
        .insert({
          organization_id: organization.id,
          user_id: userId,
          role: 'owner',
          status: 'active'
        });

      if (memberError && memberError.code !== '23505') {
        console.error('[create-app-tenant] Error adding organization member:', memberError);
      } else {
        console.log('[create-app-tenant] Added user as organization owner');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        organization,
        message: 'Tenant created successfully with Super Admin assigned'
      }),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[create-app-tenant] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});