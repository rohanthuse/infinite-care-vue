-- Fix the system_authenticate function to use correct field names
DROP FUNCTION IF EXISTS public.system_authenticate(text, text, inet, text);
DROP FUNCTION IF EXISTS public.system_authenticate(text, text);

-- Create the corrected 4-parameter system_authenticate function
CREATE OR REPLACE FUNCTION public.system_authenticate(
  p_email text, 
  p_password text, 
  p_ip_address inet, 
  p_user_agent text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  session_token TEXT;
  user_roles TEXT[] := ARRAY[]::TEXT[];
  result json;
BEGIN
  -- Find user by email
  SELECT * INTO user_record FROM public.system_users WHERE email = p_email AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
  
  -- Verify password using correct column name and crypt function
  IF user_record.encrypted_password != extensions.crypt(p_password, user_record.encrypted_password) THEN
    RETURN json_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
  
  -- Get user roles (assuming there might be a system_user_roles table)
  SELECT ARRAY_AGG(role) INTO user_roles
  FROM public.system_user_roles 
  WHERE system_user_id = user_record.id;
  
  -- If no roles table exists, default to admin role
  IF user_roles IS NULL OR array_length(user_roles, 1) IS NULL THEN
    user_roles := ARRAY['admin'];
  END IF;
  
  -- Generate session token
  session_token := encode(gen_random_bytes(32), 'base64');
  
  -- Create session with correct column names
  INSERT INTO public.system_sessions (
    system_user_id,
    session_token,
    last_activity_at,
    expires_at,
    ip_address,
    user_agent
  ) VALUES (
    user_record.id,
    session_token,
    now(),
    now() + interval '24 hours',
    p_ip_address,
    p_user_agent
  );
  
  -- Update last login time
  UPDATE public.system_users 
  SET last_login_at = now(), failed_login_attempts = 0
  WHERE id = user_record.id;
  
  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', user_record.id,
      'email', user_record.email,
      'first_name', user_record.first_name,
      'last_name', user_record.last_name,
      'roles', user_roles
    ),
    'session_token', session_token
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Authentication failed: ' || SQLERRM);
END;
$$;

-- Also create the 2-parameter version for compatibility
CREATE OR REPLACE FUNCTION public.system_authenticate(p_email text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.system_authenticate(p_email, p_password, NULL::inet, NULL::text);
END;
$$;