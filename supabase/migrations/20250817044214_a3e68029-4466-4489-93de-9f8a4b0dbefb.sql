-- Fix the RPC function to use correct column names
CREATE OR REPLACE FUNCTION public.toggle_system_user_status_with_session(
  p_session_token TEXT,
  p_user_id UUID,
  p_is_active BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_user_id UUID;
  session_role TEXT;
  result JSON;
BEGIN
  -- Validate session token and get user info with role from join
  SELECT ss.system_user_id, sur.role 
  INTO session_user_id, session_role
  FROM system_sessions ss
  JOIN system_user_roles sur ON ss.system_user_id = sur.system_user_id
  WHERE ss.session_token = p_session_token 
    AND ss.expires_at > now() 
    AND ss.is_active = true;
    
  IF session_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or expired session'
    );
  END IF;
  
  -- Check if user has super_admin role
  IF session_role != 'super_admin' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient permissions. Only super admins can toggle user status.'
    );
  END IF;
  
  -- Set the current system user context for RLS
  PERFORM set_config('app.current_system_user_id', session_user_id::text, true);
  PERFORM set_config('app.current_system_user_role', session_role, true);
  
  -- Update the user status
  UPDATE system_users 
  SET 
    is_active = p_is_active,
    updated_at = now()
  WHERE id = p_user_id;
  
  -- Check if the update was successful
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'User status updated successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;