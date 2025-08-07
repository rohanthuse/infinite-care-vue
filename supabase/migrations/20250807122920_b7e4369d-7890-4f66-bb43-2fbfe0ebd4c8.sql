-- Fix the 4-parameter system_authenticate function that the frontend calls

-- Drop the problematic 4-parameter function if it exists
DROP FUNCTION IF EXISTS public.system_authenticate(text, text, inet, text);

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
  result json;
BEGIN
  -- Find user by email
  SELECT * INTO user_record FROM public.system_users WHERE email = p_email;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
  
  -- Verify password using correct column name and crypt function
  IF user_record.encrypted_password != extensions.crypt(p_password, user_record.encrypted_password) THEN
    RETURN json_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
  
  -- Generate session token
  session_token := encode(gen_random_bytes(32), 'base64');
  
  -- Create session with correct column names
  INSERT INTO public.system_sessions (
    system_user_id,  -- Fixed: was user_id
    session_token,
    last_activity_at,  -- Fixed: was last_activity
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