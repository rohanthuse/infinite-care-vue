-- Fix the delete_system_user_with_session function with correct column names
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
  -- Validate session token and get session info (removed is_active check)
  SELECT * INTO session_record 
  FROM system_sessions 
  WHERE session_token = p_session_token 
    AND expires_at > now();
    
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or expired session'
    );
  END IF;
  
  -- Check if caller has super_admin role (fixed column name)
  IF NOT EXISTS (
    SELECT 1 FROM system_user_roles sur
    WHERE sur.system_user_id = session_record.system_user_id 
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
  
  -- Prevent self-deletion (fixed column name)
  IF p_user_id = session_record.system_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot delete your own account'
    );
  END IF;
  
  -- Check if this is the last super admin (fixed column name)
  SELECT COUNT(*) INTO admin_count
  FROM system_user_roles sur
  JOIN system_users su ON sur.system_user_id = su.id
  WHERE sur.role = 'super_admin' 
    AND su.is_active = true
    AND su.id != p_user_id;
    
  IF admin_count = 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot delete the last super admin user'
    );
  END IF;
  
  -- Log the deletion in audit logs before deletion (fixed column name)
  INSERT INTO system_audit_logs (
    system_user_id,
    action,
    resource_type,
    resource_id,
    details,
    ip_address
  ) VALUES (
    session_record.system_user_id,
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
  
  -- 1. Delete all sessions for the user (fixed: removed is_active, fixed column name)
  DELETE FROM system_sessions 
  WHERE system_user_id = p_user_id;
  
  -- 2. Delete user roles (fixed column name)
  DELETE FROM system_user_roles WHERE system_user_id = p_user_id;
  
  -- 3. Delete organization assignments (fixed column name)
  DELETE FROM system_user_organizations WHERE system_user_id = p_user_id;
  
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