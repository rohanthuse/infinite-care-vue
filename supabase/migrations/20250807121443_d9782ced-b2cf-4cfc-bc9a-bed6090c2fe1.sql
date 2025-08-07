-- Fix system authentication functions with correct column names

-- Drop existing functions to recreate them
DROP FUNCTION IF EXISTS public.system_authenticate(text, text);
DROP FUNCTION IF EXISTS public.system_validate_session(text);

-- Create fixed system_authenticate function with correct column names
CREATE OR REPLACE FUNCTION public.system_authenticate(p_email text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  session_token TEXT;
  result json;
BEGIN
  -- Find user by email
  SELECT * INTO user_record FROM public.system_users WHERE email = p_email;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
  
  -- Verify password (assuming passwords are hashed)
  IF user_record.password_hash != crypt(p_password, user_record.password_hash) THEN
    RETURN json_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
  
  -- Generate session token
  session_token := encode(gen_random_bytes(32), 'base64');
  
  -- Create session with correct column names
  INSERT INTO public.system_sessions (
    system_user_id,  -- Fixed: was user_id
    session_token,
    last_activity_at,  -- Fixed: was last_activity
    expires_at
  ) VALUES (
    user_record.id,
    session_token,
    now(),
    now() + interval '24 hours'  -- Added missing expires_at
  );
  
  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', user_record.id,
      'email', user_record.email,
      'name', user_record.name,
      'roles', user_record.roles
    ),
    'session_token', session_token
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Authentication failed: ' || SQLERRM);
END;
$$;

-- Create fixed system_validate_session function with correct column names
CREATE OR REPLACE FUNCTION public.system_validate_session(p_session_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record RECORD;
  user_record RECORD;
  result json;
BEGIN
  -- Find session with correct column names
  SELECT * INTO session_record 
  FROM public.system_sessions 
  WHERE session_token = p_session_token 
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired session');
  END IF;
  
  -- Get user details using correct column name
  SELECT * INTO user_record 
  FROM public.system_users 
  WHERE id = session_record.system_user_id;  -- Fixed: was user_id
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Update last activity with correct column name
  UPDATE public.system_sessions 
  SET last_activity_at = now()  -- Fixed: was last_activity
  WHERE session_token = p_session_token;
  
  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', user_record.id,
      'email', user_record.email,
      'name', user_record.name,
      'roles', user_record.roles
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Session validation failed: ' || SQLERRM);
END;
$$;