-- Create function to generate system session for already-authenticated users
CREATE OR REPLACE FUNCTION public.system_create_session_for_auth_user(
  p_auth_user_id uuid,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_system_user_id uuid;
  v_session_id uuid;
  v_session_token text;
  v_expires_at timestamptz;
BEGIN
  -- Find the system_user record linked to this auth user
  SELECT id INTO v_system_user_id
  FROM public.system_users
  WHERE auth_user_id = p_auth_user_id
    AND is_active = true;

  IF v_system_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No active system user found for this auth user'
    );
  END IF;

  -- Generate session token
  v_session_token := encode(gen_random_bytes(32), 'base64');
  v_expires_at := now() + interval '24 hours';

  -- Create session record
  INSERT INTO public.system_sessions (
    system_user_id,
    session_token,
    ip_address,
    user_agent,
    expires_at
  ) VALUES (
    v_system_user_id,
    v_session_token,
    p_ip_address,
    p_user_agent,
    v_expires_at
  )
  RETURNING id INTO v_session_id;

  -- Update last login
  UPDATE public.system_users
  SET last_login_at = now()
  WHERE id = v_system_user_id;

  RETURN json_build_object(
    'success', true,
    'session_token', v_session_token,
    'expires_at', v_expires_at,
    'system_user_id', v_system_user_id
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.system_create_session_for_auth_user TO authenticated;