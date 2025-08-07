-- Create the system admin user for the System Portal
-- First, ensure the system admin user exists
INSERT INTO public.system_users (
  id,
  email,
  encrypted_password,
  first_name,
  last_name,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@system.local',
  crypt('systemadmin123', gen_salt('bf')),
  'System',
  'Administrator',
  true,
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET
  encrypted_password = crypt('systemadmin123', gen_salt('bf')),
  first_name = 'System',
  last_name = 'Administrator',
  is_active = true,
  updated_at = now();

-- Ensure the system admin role exists for this user
INSERT INTO public.system_user_roles (
  id,
  system_user_id,
  role,
  granted_at,
  granted_by
) 
SELECT 
  gen_random_uuid(),
  su.id,
  'system_admin'::system_role,
  now(),
  su.id
FROM public.system_users su
WHERE su.email = 'admin@system.local'
ON CONFLICT (system_user_id, role) DO NOTHING;

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
  SELECT su.*, array_agg(sur.role::text) as roles
  INTO user_record
  FROM public.system_users su
  LEFT JOIN public.system_user_roles sur ON su.id = sur.system_user_id
  WHERE su.email = p_email 
    AND su.is_active = true
    AND su.encrypted_password = crypt(p_password, su.encrypted_password)
  GROUP BY su.id, su.email, su.encrypted_password, su.first_name, su.last_name, su.is_active, su.last_login_at, su.failed_login_attempts, su.locked_until, su.created_at, su.updated_at, su.created_by;
  
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
    system_user_id,
    session_token,
    ip_address,
    user_agent,
    expires_at,
    created_at,
    last_activity_at
  ) VALUES (
    gen_random_uuid(),
    user_record.id,
    session_token,
    p_ip_address,
    p_user_agent,
    now() + interval '24 hours',
    now(),
    now()
  );
  
  -- Update last login
  UPDATE public.system_users 
  SET last_login_at = now(), failed_login_attempts = 0
  WHERE id = user_record.id;
  
  -- Return success with user data and session token
  RETURN jsonb_build_object(
    'success', true,
    'session_token', session_token,
    'user', jsonb_build_object(
      'id', user_record.id,
      'email', user_record.email,
      'name', user_record.first_name || ' ' || user_record.last_name,
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
    su.first_name,
    su.last_name,
    array_agg(sur.role::text) as roles
  INTO session_record
  FROM public.system_sessions ss
  JOIN public.system_users su ON ss.system_user_id = su.id
  LEFT JOIN public.system_user_roles sur ON su.id = sur.system_user_id
  WHERE ss.session_token = p_session_token
    AND ss.expires_at > now()
    AND su.is_active = true
  GROUP BY ss.id, ss.system_user_id, ss.session_token, ss.ip_address, ss.user_agent, 
           ss.expires_at, ss.created_at, ss.last_activity_at,
           su.email, su.first_name, su.last_name;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired session'
    );
  END IF;
  
  -- Update last activity
  UPDATE public.system_sessions
  SET last_activity_at = now()
  WHERE id = session_record.id;
  
  -- Return user data
  RETURN jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', session_record.system_user_id,
      'email', session_record.email,
      'name', session_record.first_name || ' ' || session_record.last_name,
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
  -- Deactivate sessions by updating last_activity_at to past
  UPDATE public.system_sessions
  SET last_activity_at = now() - interval '1 hour'
  WHERE session_token = p_session_token;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Logged out successfully'
  );
END;
$$;