-- Update create_system_user_and_role_with_session to also create auth.users record
-- This ensures new system users can login through unified login interface

CREATE OR REPLACE FUNCTION public.create_system_user_and_role_with_session(
  p_session_token text,
  p_email text,
  p_password text,
  p_first_name text,
  p_last_name text,
  p_role public.system_role DEFAULT 'tenant_manager'::public.system_role
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
AS $function$
DECLARE
  v_caller_id uuid;
  v_user_id uuid;
  v_auth_user_id uuid;
BEGIN
  -- Validate session
  v_caller_id := public._validate_system_session(p_session_token);
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated as a system user');
  END IF;

  -- Require super_admin
  IF NOT public._is_system_super_admin(v_caller_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;

  -- Email must be unique in both system_users and auth.users
  IF EXISTS (SELECT 1 FROM public.system_users WHERE email = p_email) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email already exists in system');
  END IF;
  
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email already exists in auth system');
  END IF;

  -- Create auth user first with the provided password
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    confirmation_token, recovery_token,
    email_change_token_new, email_change_token_current,
    email_change, email_change_confirm_status
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(), now(), now(), '', '', '', '', '', 0
  ) RETURNING id INTO v_auth_user_id;

  -- Create system user with same password hash and link to auth user
  INSERT INTO public.system_users (
    email,
    encrypted_password,
    first_name,
    last_name,
    is_active,
    created_by,
    auth_user_id
  )
  VALUES (
    p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    p_first_name,
    p_last_name,
    TRUE,
    v_caller_id,
    v_auth_user_id
  )
  RETURNING id INTO v_user_id;

  -- Assign initial role in system_user_roles
  INSERT INTO public.system_user_roles (system_user_id, role, granted_by)
  VALUES (v_user_id, p_role, v_caller_id);
  
  -- Also assign super_admin role in user_roles for unified login compatibility
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_auth_user_id, 'super_admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'user', (
      SELECT jsonb_build_object(
        'id', su.id,
        'email', su.email,
        'first_name', su.first_name,
        'last_name', su.last_name,
        'is_active', su.is_active,
        'created_at', su.created_at,
        'auth_user_id', su.auth_user_id
      )
      FROM public.system_users su
      WHERE su.id = v_user_id
    ),
    'roles', (
      SELECT COALESCE(jsonb_agg(r.role), '[]'::jsonb)
      FROM public.system_user_roles r
      WHERE r.system_user_id = v_user_id
    ),
    'auth_user_id', v_auth_user_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- Update sync_system_user_to_organization to use existing password when auth user exists
CREATE OR REPLACE FUNCTION public.sync_system_user_to_organization(
  p_system_user_id UUID,
  p_organization_id UUID, 
  p_role TEXT DEFAULT 'member'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_user_id UUID;
  v_result JSON;
  v_system_user RECORD;
BEGIN
  -- Get the system user record
  SELECT * INTO v_system_user 
  FROM public.system_users 
  WHERE id = p_system_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'System user not found');
  END IF;
  
  -- Check if user already has an auth_user_id
  IF v_system_user.auth_user_id IS NOT NULL THEN
    v_auth_user_id := v_system_user.auth_user_id;
  ELSE
    -- Create or find auth user
    SELECT id INTO v_auth_user_id 
    FROM auth.users 
    WHERE email = v_system_user.email;
    
    IF v_auth_user_id IS NULL THEN
      -- Create new auth user using the same password from system_users
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        confirmation_token, recovery_token,
        email_change_token_new, email_change_token_current,
        email_change, email_change_confirm_status
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated', 'authenticated',
        v_system_user.email,
        v_system_user.encrypted_password, -- Use the same password hash
        now(), now(), now(), '', '', '', '', '', 0
      ) RETURNING id INTO v_auth_user_id;
    END IF;
    
    -- Update system user with auth_user_id
    UPDATE public.system_users 
    SET auth_user_id = v_auth_user_id, updated_at = now()
    WHERE public.system_users.id = p_system_user_id;
  END IF;
  
  -- Insert/update organization membership  
  INSERT INTO public.organization_members (
    organization_id, user_id, role, status, joined_at
  ) VALUES (
    p_organization_id, v_auth_user_id, p_role, 'active', now()
  ) ON CONFLICT (organization_id, user_id) 
  DO UPDATE SET 
    role = EXCLUDED.role,
    status = 'active',
    updated_at = now();
    
  -- Add user role if not exists (use super_admin for system users)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_auth_user_id, 'super_admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN json_build_object(
    'success', true,
    'auth_user_id', v_auth_user_id,
    'organization_id', p_organization_id,
    'role', p_role,
    'message', 'System user synchronized with organization and auth system'
  );
END;
$$;