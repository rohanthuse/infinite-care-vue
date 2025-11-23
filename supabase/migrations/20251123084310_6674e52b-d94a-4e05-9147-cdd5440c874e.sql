-- Fix client login flow by ensuring organization_members entries exist

-- Step 1: Add organization_members entry for existing client (jeet@gmail.com)
INSERT INTO public.organization_members (
  user_id,
  organization_id,
  role,
  status
)
SELECT 
  c.auth_user_id,
  b.organization_id,
  'client',
  'active'
FROM public.clients c
JOIN public.branches b ON c.branch_id = b.id
WHERE c.email = 'jeet@gmail.com'
  AND c.auth_user_id IS NOT NULL
ON CONFLICT (user_id, organization_id) 
DO UPDATE SET 
  status = 'active',
  role = EXCLUDED.role;

-- Step 2: Update safe_setup_client_auth to automatically create organization_members entries
CREATE OR REPLACE FUNCTION public.safe_setup_client_auth(p_client_id uuid, p_password text, p_admin_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  client_record RECORD;
  v_auth_user_id uuid;
  v_organization_id uuid;
  result json;
BEGIN
  -- Check if the admin has permission (must be super_admin or branch_admin)
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_admin_id AND role IN ('super_admin', 'branch_admin')
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;
  
  -- Get client record with organization info
  SELECT c.*, b.organization_id 
  INTO client_record
  FROM public.clients c
  JOIN public.branches b ON c.branch_id = b.id
  WHERE c.id = p_client_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Client not found');
  END IF;
  
  -- Store organization_id for later use
  v_organization_id := client_record.organization_id;
  
  -- Check for null email early
  IF client_record.email IS NULL OR client_record.email = '' THEN
    RETURN json_build_object('success', false, 'error', 'Client email is required for authentication setup');
  END IF;
  
  -- Log the client email for debugging
  RAISE NOTICE 'Setting up auth for client email: %', client_record.email;
  
  -- Enhanced approach to handle auth user creation more safely
  BEGIN
    -- Generate a new UUID for potential new user
    v_auth_user_id := gen_random_uuid();
    
    -- Try to insert a new auth user with all required fields properly set
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change_token_current,
      email_change,
      email_change_confirm_status
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_auth_user_id,
      'authenticated',
      'authenticated',
      client_record.email,
      crypt(p_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      '',
      '',
      '',
      '',
      '',
      0
    );
    
    -- Assign client role
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (v_auth_user_id, 'client')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Link auth user to client
    UPDATE public.clients 
    SET 
      temporary_password = p_password,
      invitation_sent_at = now(),
      password_set_by = p_admin_id,
      auth_user_id = v_auth_user_id
    WHERE public.clients.id = p_client_id;
    
    -- NEW: Add organization_members entry for the client
    INSERT INTO public.organization_members (
      user_id,
      organization_id,
      role,
      status
    ) VALUES (
      v_auth_user_id,
      v_organization_id,
      'client',
      'active'
    )
    ON CONFLICT (user_id, organization_id) 
    DO UPDATE SET 
      status = 'active',
      role = EXCLUDED.role;
    
    RAISE NOTICE 'Successfully created auth user %, linked to client %, and added to organization %', 
      v_auth_user_id, p_client_id, v_organization_id;
    
    RETURN json_build_object(
      'success', true, 
      'message', 'Client authentication created and linked successfully',
      'auth_user_id', v_auth_user_id,
      'user_created', true,
      'client_linked', true
    );
    
  EXCEPTION
    WHEN unique_violation THEN
      -- User already exists, try to update their password and link properly
      BEGIN
        -- Find the existing user ID by email
        SELECT au.id INTO v_auth_user_id 
        FROM auth.users au
        WHERE au.email = client_record.email
        LIMIT 1;
        
        IF v_auth_user_id IS NOT NULL THEN
          RAISE NOTICE 'Found existing auth user % for email %', v_auth_user_id, client_record.email;
          
          -- Update existing user's password
          UPDATE auth.users 
          SET 
            encrypted_password = crypt(p_password, gen_salt('bf')),
            updated_at = now(),
            email_change_token_new = COALESCE(email_change_token_new, ''),
            email_change_token_current = COALESCE(email_change_token_current, ''),
            email_change = COALESCE(email_change, ''),
            email_change_confirm_status = COALESCE(email_change_confirm_status, 0)
          WHERE id = v_auth_user_id;
          
          -- Ensure client role exists
          INSERT INTO public.user_roles (user_id, role) 
          VALUES (v_auth_user_id, 'client')
          ON CONFLICT (user_id, role) DO NOTHING;
          
          -- Link auth user to client
          UPDATE public.clients 
          SET 
            temporary_password = p_password,
            invitation_sent_at = now(),
            password_set_by = p_admin_id,
            auth_user_id = v_auth_user_id
          WHERE public.clients.id = p_client_id;
          
          -- NEW: Add organization_members entry for the client
          INSERT INTO public.organization_members (
            user_id,
            organization_id,
            role,
            status
          ) VALUES (
            v_auth_user_id,
            v_organization_id,
            'client',
            'active'
          )
          ON CONFLICT (user_id, organization_id) 
          DO UPDATE SET 
            status = 'active',
            role = EXCLUDED.role;
          
          RAISE NOTICE 'Successfully updated auth user %, linked to client %, and added to organization %', 
            v_auth_user_id, p_client_id, v_organization_id;
          
          RETURN json_build_object(
            'success', true, 
            'message', 'Client authentication updated and linked successfully',
            'auth_user_id', v_auth_user_id,
            'user_created', false,
            'client_linked', true
          );
        ELSE
          RETURN json_build_object('success', false, 'error', 'User exists but could not be found for update');
        END IF;
        
      EXCEPTION
        WHEN OTHERS THEN
          RETURN json_build_object('success', false, 'error', 'Failed to update existing user: ' || SQLERRM);
      END;
      
    WHEN OTHERS THEN
      RETURN json_build_object('success', false, 'error', 'Failed to create auth user: ' || SQLERRM);
  END;
END;
$function$