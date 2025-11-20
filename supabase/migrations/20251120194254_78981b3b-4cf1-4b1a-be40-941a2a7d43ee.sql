-- Fix validate_system_session volatility: it performs an UPDATE, so must be VOLATILE
CREATE OR REPLACE FUNCTION public.validate_system_session(p_session_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE  -- Changed from STABLE to VOLATILE to allow UPDATE operations
SET search_path = public
AS $$
DECLARE
  v_system_user_id uuid;
BEGIN
  IF p_session_token IS NULL OR p_session_token = '' THEN
    RETURN NULL;
  END IF;
  
  -- Validate session and get user_id
  SELECT ss.system_user_id INTO v_system_user_id
  FROM public.system_sessions ss
  JOIN public.system_users su ON ss.system_user_id = su.id
  WHERE ss.session_token = p_session_token
    AND ss.expires_at > now()
    AND ss.last_activity_at > now() - interval '1 hour'
    AND su.is_active = true
  LIMIT 1;
  
  -- Update activity if valid
  IF v_system_user_id IS NOT NULL THEN
    UPDATE public.system_sessions
    SET last_activity_at = now()
    WHERE session_token = p_session_token;
  END IF;
  
  RETURN v_system_user_id;
END;
$$;