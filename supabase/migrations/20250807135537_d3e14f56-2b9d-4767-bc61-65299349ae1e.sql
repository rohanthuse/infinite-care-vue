-- Create the system admin user for the System Portal
-- First, ensure the system admin user exists
INSERT INTO public.system_users (
  id,
  email,
  password_hash,
  full_name,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@system.local',
  crypt('systemadmin123', gen_salt('bf')),
  'System Administrator',
  true,
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET
  password_hash = crypt('systemadmin123', gen_salt('bf')),
  full_name = 'System Administrator',
  is_active = true,
  updated_at = now();

-- Ensure the system admin role exists for this user
INSERT INTO public.system_user_roles (
  id,
  user_id,
  role,
  granted_at,
  granted_by
) 
SELECT 
  gen_random_uuid(),
  su.id,
  'system_admin',
  now(),
  su.id
FROM public.system_users su
WHERE su.email = 'admin@system.local'
ON CONFLICT (user_id, role) DO NOTHING;

-- Create or update the system authentication function
CREATE OR REPLACE FUNCTION public.system_authenticate(
  p_email text,
  p_password text,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  session_token text;
  user_roles text[];
BEGIN
  -- Find user and verify password
  SELECT su.*, array_agg(sur.role) as roles
  INTO user_record
  FROM public.system_users su
  LEFT JOIN public.system_user_roles sur ON su.id = sur.user_id
  WHERE su.email = p_email 
    AND su.is_active = true
    AND su.password_hash = crypt(p_password, su.password_hash)
  GROUP BY su.id, su.email, su.password_hash, su.full_name, su.is_active, su.created_at, su.updated_at;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid credentials'
    );
  END IF;
  
  -- Generate session token
  session_token := encode(gen_random_bytes(32), 'base64');
  
  -- Create session
  INSERT INTO public.system_sessions (
    id,
    user_id,
    session_token,
    ip_address,
    user_agent,
    expires_at,
    created_at
  ) VALUES (
    gen_random_uuid(),
    user_record.id,
    session_token,
    p_ip_address,
    p_user_agent,
    now() + interval '24 hours',
    now()
  );
  
  -- Return success with user data and session token
  RETURN jsonb_build_object(
    'success', true,
    'session_token', session_token,
    'user', jsonb_build_object(
      'id', user_record.id,
      'email', user_record.email,
      'name', user_record.full_name,
      'roles', COALESCE(user_record.roles, ARRAY[]::text[])
    )
  );
END;
$$;

-- Create or update the system session validation function
CREATE OR REPLACE FUNCTION public.system_validate_session(
  p_session_token text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record RECORD;
  user_roles text[];
BEGIN
  -- Find valid session with user data
  SELECT 
    ss.*,
    su.email,
    su.full_name,
    array_agg(sur.role) as roles
  INTO session_record
  FROM public.system_sessions ss
  JOIN public.system_users su ON ss.user_id = su.id
  LEFT JOIN public.system_user_roles sur ON su.id = sur.user_id
  WHERE ss.session_token = p_session_token
    AND ss.expires_at > now()
    AND ss.is_active = true
    AND su.is_active = true
  GROUP BY ss.id, ss.user_id, ss.session_token, ss.ip_address, ss.user_agent, 
           ss.expires_at, ss.created_at, ss.updated_at, ss.is_active,
           su.email, su.full_name;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired session'
    );
  END IF;
  
  -- Update last activity
  UPDATE public.system_sessions
  SET updated_at = now()
  WHERE id = session_record.id;
  
  -- Return user data
  RETURN jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', session_record.user_id,
      'email', session_record.email,
      'name', session_record.full_name,
      'roles', COALESCE(session_record.roles, ARRAY[]::text[])
    )
  );
END;
$$;

-- Create or update the system logout function
CREATE OR REPLACE FUNCTION public.system_logout(
  p_session_token text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deactivate the session
  UPDATE public.system_sessions
  SET is_active = false, updated_at = now()
  WHERE session_token = p_session_token;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Logged out successfully'
  );
END;
$$;