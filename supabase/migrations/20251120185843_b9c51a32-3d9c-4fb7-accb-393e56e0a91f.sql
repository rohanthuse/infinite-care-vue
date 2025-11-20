-- Drop existing function
DROP FUNCTION IF EXISTS public.get_current_system_session();

-- Create updated function that reads session token from request headers
CREATE OR REPLACE FUNCTION public.get_current_system_session()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  session_id uuid;
  session_token text;
  v_session record;
BEGIN
  -- Try to get session token from request headers
  BEGIN
    session_token := current_setting('request.headers', true)::json->>'x-system-session-token';
  EXCEPTION WHEN OTHERS THEN
    session_token := NULL;
  END;
  
  -- If no token in headers, return NULL
  IF session_token IS NULL OR session_token = '' THEN
    RETURN NULL;
  END IF;
  
  -- Validate the session token
  SELECT id, expires_at, last_activity_at
  INTO v_session
  FROM public.system_sessions 
  WHERE system_sessions.session_token = get_current_system_session.session_token
  LIMIT 1;
  
  -- Check if session exists and is valid
  IF v_session.id IS NOT NULL 
     AND v_session.expires_at > now() 
     AND v_session.last_activity_at > now() - interval '1 hour' THEN
    
    -- Update last activity timestamp
    UPDATE public.system_sessions 
    SET last_activity_at = now()
    WHERE id = v_session.id;
    
    RETURN v_session.id;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_current_system_session() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_system_session() TO anon;

COMMENT ON FUNCTION public.get_current_system_session() IS 'Validates system session token from request headers and returns session ID if valid';