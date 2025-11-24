import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";
import { generateMedInfiniteEmailHTML } from "../_shared/email-template.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    // Fetch organization details for email
    const { data: orgData } = await supabaseAdmin
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();
    
    const organizationName = orgData?.name || 'Med-Infinite';
    const siteUrl = Deno.env.get('SITE_URL') || 'https://med-infinite.care';
    const loginUrl = `${siteUrl}/login`;

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

    let userId: string;
    let userAlreadyExists = false;

    // Try-catch pattern: Optimistically try to create user first
    console.log('[User Creation] Attempting to create auth user for email:', email);
    
    const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName
      }
    });

    // Handle user creation result
    if (createUserError) {
      console.log('[User Creation] Creation failed:', createUserError.message);
      
      // Check if error is due to email already existing
      const emailExistsErrors = [
        'email_exists',
        'already been registered',
        'user_already_exists',
        'duplicate key value'
      ];
      
      const isEmailExistsError = 
        emailExistsErrors.some(msg => createUserError.message?.toLowerCase().includes(msg)) ||
        createUserError.status === 422;

      if (isEmailExistsError) {
        console.log('[User Creation] Email exists - fetching existing user with case-insensitive match');
        userAlreadyExists = true;
        
        // Fetch existing user with case-insensitive email matching
        const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) {
          console.error('[User Fetch] Error listing users:', listError);
          throw new Error('Failed to fetch existing user');
        }

        // Case-insensitive email search
        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = existingUsers.users.find(
          u => u.email?.toLowerCase().trim() === normalizedEmail
        );

        if (!existingUser) {
          console.error('[User Fetch] Email exists but user not found in list');
          throw new Error('User email already exists but could not be retrieved. Please contact support.');
        }

        userId = existingUser.id;
        console.log('[User Found] Existing user ID:', userId);
      } else {
        // Different error - throw it
        console.error('[User Creation] Unexpected error:', createUserError);
        throw createUserError;
      }
    } else {
      // User created successfully
      if (!authData?.user) {
        throw new Error('User creation succeeded but no user data returned');
      }
      userId = authData.user.id;
      console.log('[User Created] New user ID:', userId);
    }

    // Check if user is already a member of this organization
    console.log('[Membership Check] Checking if user is already in organization:', organizationId);
    
    const { data: existingMember, error: memberCheckError } = await supabaseAdmin
      .from('organization_members')
      .select('id, status, role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (memberCheckError) {
      console.error('[Membership Check] Error checking membership:', memberCheckError);
      throw memberCheckError;
    }

    // Handle existing member scenarios
    if (existingMember) {
      console.log('[Membership Check] User is already a member. Status:', existingMember.status);
      
      if (existingMember.status === 'active') {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `${email} is already an active ${existingMember.role} in this organisation` 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Reactivate inactive member
      console.log('[Membership Update] Reactivating inactive member with new role:', role);
      
      const { error: updateError } = await supabaseAdmin
        .from('organization_members')
        .update({ 
          status: 'active',
          role: role,
          permissions: permissions,
          joined_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingMember.id);

      if (updateError) {
        console.error('[Membership Update] Error reactivating:', updateError);
        throw updateError;
      }

      // Send reactivation email
      try {
        const emailHtml = generateMedInfiniteEmailHTML({
          title: 'Account Reactivated',
          previewText: `Your ${organizationName} account has been reactivated`,
          content: `
            <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 16px;">Welcome Back, ${firstName}!</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin-bottom: 16px;">
              Great news! Your account with <strong>${organizationName}</strong> has been reactivated on Med-Infinite.
            </p>
            <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
              You can now log in and access all platform features with your existing credentials.
            </p>
            <div style="background-color: #f3f4f6; border-left: 4px solid #2563eb; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
              <p style="color: #1f2937; font-size: 14px; margin: 0; font-weight: 600;">Login Email:</p>
              <p style="color: #4b5563; font-size: 14px; margin: 4px 0 0 0;">${email}</p>
            </div>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${loginUrl}" class="button">Log In to Your Account</a>
            </div>
            <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin-top: 24px;">
              If you have any questions or need assistance, please don't hesitate to contact your organization administrator.
            </p>
          `,
          footerText: 'You received this email because your account was reactivated by an administrator.'
        });

        await resend.emails.send({
          from: 'Med-Infinite <onboarding@resend.dev>',
          to: [email],
          subject: `Your ${organizationName} Account Has Been Reactivated`,
          html: emailHtml,
        });

        console.log('[Email] Reactivation email sent to:', email);
      } catch (emailError) {
        console.error('[Email] Failed to send reactivation email:', emailError);
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

    // New member - handle profile and welcome email for newly created users
    console.log('[New Member] Adding user to organization. User already exists:', userAlreadyExists);

    if (!userAlreadyExists) {
      // Create profile for new users only
      console.log('[Profile] Creating profile for new user');
      
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          first_name: firstName,
          last_name: lastName,
          email: email
        });

      if (profileError && profileError.code !== '23505') {
        console.error('[Profile] Error creating profile:', profileError);
      }

      // Send welcome email for new users only
      try {
        const emailHtml = generateMedInfiniteEmailHTML({
          title: 'Welcome to Med-Infinite',
          previewText: `You've been added to ${organizationName}`,
          content: `
            <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 16px;">Welcome, ${firstName}!</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin-bottom: 16px;">
              You've been added to <strong>${organizationName}</strong> on the Med-Infinite Care Management Platform.
            </p>
            <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
              Your account has been created and is ready to use. Below are your login credentials:
            </p>
            <div style="background-color: #f3f4f6; border-left: 4px solid #2563eb; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
              <p style="color: #1f2937; font-size: 14px; margin: 0; font-weight: 600;">Login Email:</p>
              <p style="color: #4b5563; font-size: 14px; margin: 4px 0 12px 0;">${email}</p>
              <p style="color: #1f2937; font-size: 14px; margin: 0; font-weight: 600;">Password:</p>
              <p style="color: #4b5563; font-size: 14px; margin: 4px 0 0 0;">The password provided to you by your administrator</p>
            </div>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${loginUrl}" class="button">Log In to Med-Infinite</a>
            </div>
            <h3 style="color: #1f2937; font-size: 18px; margin: 32px 0 16px 0;">Getting Started</h3>
            <ul style="color: #4b5563; font-size: 14px; line-height: 24px; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Complete your profile with additional information</li>
              <li style="margin-bottom: 8px;">Explore the dashboard and familiarize yourself with the platform</li>
              <li style="margin-bottom: 8px;">Review your role and permissions with your administrator</li>
              <li style="margin-bottom: 8px;">Access training resources and documentation</li>
            </ul>
            <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin-top: 24px;">
              If you have any questions or need assistance getting started, please contact your organization administrator.
            </p>
          `,
          footerText: 'You received this email because you were added as a member of an organization on Med-Infinite.'
        });

        await resend.emails.send({
          from: 'Med-Infinite <onboarding@resend.dev>',
          to: [email],
          subject: `Welcome to ${organizationName} on Med-Infinite`,
          html: emailHtml,
        });

        console.log('[Email] Welcome email sent to:', email);
      } catch (emailError) {
        console.error('[Email] Failed to send welcome email:', emailError);
      }
    } else {
      console.log('[Profile] Skipping profile creation and welcome email - user already exists');
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

    // Step 6: Add system-level role to user_roles table for super_admins and owners
    // This ensures consistent role detection across the application
    if (role === 'super_admin' || role === 'owner') {
      console.log('[User Roles] Adding system-level role to user_roles table for:', role);
      
      const { error: userRoleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: 'super_admin' // Map both 'super_admin' and 'owner' to system 'super_admin'
        }, {
          onConflict: 'user_id'
        });

      if (userRoleError) {
        console.error('[User Roles] Error adding user to user_roles:', userRoleError);
        // Don't fail the entire operation - membership is already created
        console.warn('[User Roles] Membership created but user_roles entry failed. User may experience role detection issues.');
      } else {
        console.log('[User Roles] System-level role added to user_roles successfully');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Member added successfully',
        userId: userId,
        memberId: memberId,
        userCreated: !userAlreadyExists
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Error] create-organization-member failed:', error);
    
    // Provide user-friendly error messages
    let errorMessage = 'Failed to create organization member';
    let statusCode = 500;

    if (error.message?.includes('email_exists') || error.message?.includes('already been registered')) {
      errorMessage = 'This email address is already registered in the system';
      statusCode = 400;
    } else if (error.message?.includes('Invalid authentication')) {
      errorMessage = 'Authentication failed. Please log in again.';
      statusCode = 401;
    } else if (error.message?.includes('permission')) {
      errorMessage = 'You do not have permission to perform this action';
      statusCode = 403;
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('[Error] Returning error to client:', { errorMessage, statusCode });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
