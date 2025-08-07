-- Update system_authenticate function to include user roles
CREATE OR REPLACE FUNCTION public.system_authenticate(
  p_email TEXT,
  p_password TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  session_token TEXT;
  result JSON;
BEGIN
  -- Check if user exists and password is correct
  SELECT id, email, first_name, last_name, status, failed_login_attempts, locked_until
  INTO user_record
  FROM public.system_users
  WHERE email = p_email AND password_hash = crypt(p_password, password_hash);
  
  IF NOT FOUND THEN
    -- Increment failed login attempts for existing user
    UPDATE public.system_users 
    SET failed_login_attempts = failed_login_attempts + 1,
        locked_until = CASE 
          WHEN failed_login_attempts + 1 >= 5 THEN now() + interval '30 minutes'
          ELSE locked_until
        END
    WHERE email = p_email;
    
    RETURN json_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
  
  -- Check if account is locked
  IF user_record.locked_until IS NOT NULL AND user_record.locked_until > now() THEN
    RETURN json_build_object('success', false, 'error', 'Account temporarily locked');
  END IF;
  
  -- Check if account is active
  IF user_record.status != 'active' THEN
    RETURN json_build_object('success', false, 'error', 'Account is not active');
  END IF;
  
  -- Generate session token
  session_token := encode(gen_random_bytes(32), 'base64');
  
  -- Create session
  INSERT INTO public.system_sessions (
    user_id, session_token, ip_address, user_agent, created_at, last_activity
  ) VALUES (
    user_record.id, session_token, p_ip_address, p_user_agent, now(), now()
  );
  
  -- Reset failed login attempts
  UPDATE public.system_users 
  SET failed_login_attempts = 0, locked_until = NULL, last_login = now()
  WHERE id = user_record.id;
  
  -- Get user roles
  WITH user_roles_agg AS (
    SELECT array_agg(role_name) as roles
    FROM public.system_user_roles sur
    JOIN public.system_roles sr ON sur.role_id = sr.id
    WHERE sur.user_id = user_record.id AND sur.is_active = true
  )
  SELECT json_build_object(
    'success', true,
    'session_token', session_token,
    'user', json_build_object(
      'id', user_record.id,
      'email', user_record.email,
      'first_name', user_record.first_name,
      'last_name', user_record.last_name,
      'roles', COALESCE(ura.roles, ARRAY[]::text[])
    )
  ) INTO result
  FROM user_roles_agg ura;
  
  RETURN result;
END;
$$;