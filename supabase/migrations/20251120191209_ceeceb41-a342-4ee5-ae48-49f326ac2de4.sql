-- Fix get_current_system_session function to properly validate session tokens
-- The bug was on line 32 where it compared system_sessions.session_token with get_current_system_session.session_token
-- Instead of the local variable session_token

DROP FUNCTION IF EXISTS public.get_current_system_session();

CREATE OR REPLACE FUNCTION public.get_current_system_session()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_session_id uuid;
  v_token text;
  v_expires_at timestamp with time zone;
  v_last_activity_at timestamp with time zone;
  v_user_is_active boolean;
BEGIN
  -- Try to get session token from request headers
  BEGIN
    v_token := current_setting('request.headers', true)::json->>'x-system-session-token';
  EXCEPTION WHEN OTHERS THEN
    v_token := NULL;
  END;
  
  -- If no token in headers, return NULL
  IF v_token IS NULL OR v_token = '' THEN
    RETURN NULL;
  END IF;
  
  -- Validate the session token and check if user is active
  SELECT 
    ss.id,
    ss.expires_at,
    ss.last_activity_at,
    su.is_active
  INTO 
    v_session_id,
    v_expires_at,
    v_last_activity_at,
    v_user_is_active
  FROM public.system_sessions ss
  JOIN public.system_users su ON ss.system_user_id = su.id
  WHERE ss.session_token = v_token  -- Fixed: was comparing with wrong variable
    AND ss.expires_at > now()
    AND ss.last_activity_at > now() - interval '1 hour'
    AND su.is_active = true
  ORDER BY ss.last_activity_at DESC
  LIMIT 1;
  
  -- If session is valid, update last activity and return session ID
  IF v_session_id IS NOT NULL THEN
    UPDATE public.system_sessions 
    SET last_activity_at = now()
    WHERE id = v_session_id;
    
    RETURN v_session_id;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_current_system_session() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_system_session() TO anon;

COMMENT ON FUNCTION public.get_current_system_session() IS 'Validates system session token from request headers and returns session ID if valid. Fixed to properly compare session token variable.';