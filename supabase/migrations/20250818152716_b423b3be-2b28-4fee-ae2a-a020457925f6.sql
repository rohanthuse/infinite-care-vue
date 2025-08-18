-- Create RPC function to delete system users with proper validation and cascading
CREATE OR REPLACE FUNCTION delete_system_user_with_session(
  p_user_id UUID,
  p_session_token TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record RECORD;
  user_record RECORD;
  admin_count INTEGER;
  result JSON;
BEGIN
  -- Validate session token and get session info
  SELECT * INTO session_record 
  FROM system_sessions 
  WHERE session_token = p_session_token 
    AND expires_at > now() 
    AND is_active = true;
    
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or expired session'
    );
  END IF;
  
  -- Check if caller has super_admin role
  IF NOT EXISTS (
    SELECT 1 FROM system_user_roles sur
    WHERE sur.user_id = session_record.user_id 
      AND sur.role = 'super_admin'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient permissions - super admin role required'
    );
  END IF;
  
  -- Get user to delete
  SELECT * INTO user_record FROM system_users WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;
  
  -- Prevent self-deletion
  IF p_user_id = session_record.user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot delete your own account'
    );
  END IF;
  
  -- Check if this is the last super admin
  SELECT COUNT(*) INTO admin_count
  FROM system_user_roles sur
  JOIN system_users su ON sur.user_id = su.id
  WHERE sur.role = 'super_admin' 
    AND su.is_active = true
    AND su.id != p_user_id;
    
  IF admin_count = 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot delete the last super admin user'
    );
  END IF;
  
  -- Log the deletion in audit logs before deletion
  INSERT INTO system_audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    ip_address
  ) VALUES (
    session_record.user_id,
    'delete_user',
    'system_user',
    p_user_id,
    json_build_object(
      'deleted_user_email', user_record.email,
      'deleted_user_name', user_record.first_name || ' ' || user_record.last_name
    ),
    session_record.ip_address
  );
  
  -- Begin cascading deletion
  
  -- 1. Terminate all active sessions for the user
  UPDATE system_sessions 
  SET is_active = false, ended_at = now()
  WHERE user_id = p_user_id AND is_active = true;
  
  -- 2. Delete user roles
  DELETE FROM system_user_roles WHERE user_id = p_user_id;
  
  -- 3. Delete organization assignments
  DELETE FROM system_user_organizations WHERE user_id = p_user_id;
  
  -- 4. Finally delete the user record
  DELETE FROM system_users WHERE id = p_user_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'System user deleted successfully',
    'deleted_user', json_build_object(
      'id', p_user_id,
      'email', user_record.email,
      'name', user_record.first_name || ' ' || user_record.last_name
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to delete user: ' || SQLERRM
    );
END;
$$;