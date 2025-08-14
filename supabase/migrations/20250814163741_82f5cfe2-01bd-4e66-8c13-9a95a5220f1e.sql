-- Fix the system user password reset function to use correct session validation
CREATE OR REPLACE FUNCTION public.reset_system_user_password_with_session(
  p_user_id uuid,
  p_new_password text,
  p_session_token text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record RECORD;
  user_record RECORD;
  auth_user_id uuid;
  result json;
BEGIN
  -- Validate session token and get admin user info (using correct table joins)
  SELECT su.*, sur.role INTO session_record
  FROM public.system_sessions ss
  JOIN public.system_users su ON ss.system_user_id = su.id
  LEFT JOIN public.system_user_roles sur ON su.id = sur.system_user_id
  WHERE ss.session_token = p_session_token 
    AND ss.expires_at > now()
    AND ss.is_active = true
    AND su.is_active = true
    AND sur.role = 'super_admin';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid session or insufficient permissions');
  END IF;
  
  -- Get the system user record
  SELECT * INTO user_record FROM public.system_users WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'System user not found');
  END IF;
  
  -- Check if system user already has an auth account
  SELECT id INTO auth_user_id FROM auth.users WHERE email = user_record.email;
  
  IF auth_user_id IS NULL THEN
    -- Create new auth user if doesn't exist
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
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      user_record.email,
      crypt(p_new_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      '',
      '',
      '',
      '',
      '',
      0
    ) RETURNING id INTO auth_user_id;
    
    -- Get the user's role from system_user_roles and assign it
    INSERT INTO public.user_roles (user_id, role) 
    SELECT auth_user_id, sur.role::app_role
    FROM public.system_user_roles sur 
    WHERE sur.system_user_id = p_user_id
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Update existing user's password
    UPDATE auth.users 
    SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = auth_user_id;
  END IF;
  
  -- Update system user record
  UPDATE public.system_users 
  SET password_reset_at = now(),
      password_reset_by = session_record.id,
      updated_at = now()
  WHERE id = p_user_id;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Password reset successfully',
    'auth_user_id', auth_user_id
  );
END;
$$;