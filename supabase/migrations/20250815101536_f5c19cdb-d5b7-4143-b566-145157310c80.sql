-- Fix system users organization display by creating proper RPC function

-- Create enhanced RPC function that properly joins system users with organizations via auth.users and organization_members
CREATE OR REPLACE FUNCTION list_system_users_with_session_and_orgs(p_session_token TEXT)
RETURNS TABLE(
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  is_active BOOLEAN,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  role TEXT,
  organizations JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_user_id UUID;
BEGIN
  -- Validate session token and get user ID
  SELECT user_id INTO session_user_id
  FROM system_sessions 
  WHERE token = p_session_token 
    AND expires_at > now() 
    AND is_active = true;
    
  IF session_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session token';
  END IF;
  
  -- Check if user is super admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = session_user_id AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;
  
  -- Return system users with their organizations
  RETURN QUERY
  SELECT 
    su.id,
    su.email,
    su.first_name,
    su.last_name,
    su.is_active,
    su.last_login_at,
    su.created_at,
    COALESCE(ur.role::TEXT, 'support_admin') as role,
    COALESCE(
      json_agg(
        CASE 
          WHEN o.id IS NOT NULL THEN
            json_build_object(
              'id', o.id,
              'name', o.name,
              'slug', o.slug
            )
          ELSE NULL
        END
      ) FILTER (WHERE o.id IS NOT NULL),
      '[]'::json
    )::jsonb as organizations
  FROM system_users su
  LEFT JOIN auth.users au ON su.email = au.email
  LEFT JOIN user_roles ur ON au.id = ur.user_id AND ur.role = 'super_admin'
  LEFT JOIN organization_members om ON au.id = om.user_id AND om.status = 'active'
  LEFT JOIN organizations o ON om.organization_id = o.id
  GROUP BY su.id, su.email, su.first_name, su.last_name, su.is_active, su.last_login_at, su.created_at, ur.role
  ORDER BY su.created_at DESC;
END;
$$;

-- Update the original RPC to use the new enhanced version
CREATE OR REPLACE FUNCTION list_system_users_with_session(p_session_token TEXT)
RETURNS TABLE(
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  is_active BOOLEAN,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use the enhanced function and just return the basic fields for backward compatibility
  RETURN QUERY
  SELECT 
    enhanced.id,
    enhanced.email,
    enhanced.first_name,
    enhanced.last_name,
    enhanced.is_active,
    enhanced.last_login_at,
    enhanced.created_at,
    enhanced.role
  FROM list_system_users_with_session_and_orgs(p_session_token) AS enhanced;
END;
$$;