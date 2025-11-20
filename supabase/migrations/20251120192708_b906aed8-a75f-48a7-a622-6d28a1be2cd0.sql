-- Fix system session function volatility issue
-- The problem: get_current_system_session() was STABLE but modified data (last_activity_at)
-- Solution: Split into read-only validation (STABLE) and separate activity update (VOLATILE)

-- Drop the buggy function
DROP FUNCTION IF EXISTS public.get_current_system_session();

-- Create read-only session validation function (STABLE is correct - only reads data)
CREATE OR REPLACE FUNCTION public.get_current_system_session_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
  v_token text;
BEGIN
  -- Get session token from request headers
  BEGIN
    v_token := current_setting('request.headers', true)::json->>'x-system-session-token';
  EXCEPTION WHEN OTHERS THEN
    v_token := NULL;
  END;
  
  -- If no token in headers, return NULL
  IF v_token IS NULL OR v_token = '' THEN
    RETURN NULL;
  END IF;
  
  -- Validate session token (read-only operation)
  SELECT ss.id INTO v_session_id
  FROM public.system_sessions ss
  JOIN public.system_users su ON ss.system_user_id = su.id
  WHERE ss.session_token = v_token
    AND ss.expires_at > now()
    AND ss.last_activity_at > now() - interval '1 hour'
    AND su.is_active = true
  ORDER BY ss.last_activity_at DESC
  LIMIT 1;
  
  RETURN v_session_id;
END;
$$;

-- Create activity update function (VOLATILE is correct - modifies data)
CREATE OR REPLACE FUNCTION public.update_system_session_activity(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path = public
AS $$
BEGIN
  UPDATE public.system_sessions 
  SET last_activity_at = now()
  WHERE id = p_session_id;
END;
$$;

-- Update get_current_system_user_id to use new read-only function
CREATE OR REPLACE FUNCTION public.get_current_system_user_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_id uuid;
  session_id uuid;
BEGIN
  -- Use the new read-only session validation function
  session_id := get_current_system_session_id();
  
  IF session_id IS NOT NULL THEN
    SELECT system_user_id INTO user_id
    FROM public.system_sessions
    WHERE id = session_id;
  END IF;
  
  RETURN user_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_current_system_session_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_system_session_id() TO anon;
GRANT EXECUTE ON FUNCTION public.update_system_session_activity(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_system_session_activity(uuid) TO anon;

COMMENT ON FUNCTION public.get_current_system_session_id() IS 'Read-only function that validates system session token from request headers and returns session ID if valid.';
COMMENT ON FUNCTION public.update_system_session_activity(uuid) IS 'Updates last_activity_at for a given system session ID.';
COMMENT ON FUNCTION public.get_current_system_user_id() IS 'Returns the system user ID for the current session using read-only validation.';