-- Phase 1 & 2: Create database functions for user role management

-- Function to map organization roles to system roles
CREATE OR REPLACE FUNCTION map_org_role_to_system_role(org_role text)
RETURNS app_role
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  CASE org_role
    WHEN 'owner' THEN RETURN 'super_admin'::app_role;
    WHEN 'admin' THEN RETURN 'branch_admin'::app_role;
    WHEN 'manager' THEN RETURN 'branch_admin'::app_role;
    WHEN 'member' THEN RETURN 'carer'::app_role;
    ELSE RETURN 'carer'::app_role; -- Default fallback
  END CASE;
END;
$$;

-- Function to create organization member with proper role assignment
CREATE OR REPLACE FUNCTION create_organization_member_with_role(
  p_organization_id uuid,
  p_user_id uuid,
  p_role text,
  p_permissions jsonb DEFAULT '[]'::jsonb,
  p_invited_by uuid DEFAULT auth.uid()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  member_id uuid;
  system_role app_role;
BEGIN
  -- Map organization role to system role
  system_role := map_org_role_to_system_role(p_role);
  
  -- Create organization member
  INSERT INTO public.organization_members (
    organization_id,
    user_id,
    role,
    permissions,
    invited_by,
    status
  ) VALUES (
    p_organization_id,
    p_user_id,
    p_role,
    p_permissions,
    p_invited_by,
    'active'
  ) RETURNING id INTO member_id;
  
  -- Create corresponding user role (ignore conflicts)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, system_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN member_id;
END;
$$;

-- Function to sync existing organization members with user roles
CREATE OR REPLACE FUNCTION sync_organization_members_with_roles()
RETURNS TABLE(
  user_id uuid,
  email text,
  org_role text,
  system_role app_role,
  action_taken text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  member_record RECORD;
  mapped_role app_role;
  role_exists BOOLEAN;
BEGIN
  FOR member_record IN 
    SELECT 
      om.user_id,
      om.role as org_role,
      au.email
    FROM organization_members om
    JOIN auth.users au ON om.user_id = au.id
    WHERE om.status = 'active'
  LOOP
    -- Map the organization role to system role
    mapped_role := map_org_role_to_system_role(member_record.org_role);
    
    -- Check if user role already exists
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = member_record.user_id 
      AND ur.role = mapped_role
    ) INTO role_exists;
    
    IF NOT role_exists THEN
      -- Create the missing user role
      INSERT INTO public.user_roles (user_id, role)
      VALUES (member_record.user_id, mapped_role);
      
      -- Return the action taken
      RETURN QUERY SELECT 
        member_record.user_id,
        member_record.email,
        member_record.org_role,
        mapped_role,
        'created_missing_role'::text;
    ELSE
      -- Role already exists
      RETURN QUERY SELECT 
        member_record.user_id,
        member_record.email,
        member_record.org_role,
        mapped_role,
        'role_already_exists'::text;
    END IF;
  END LOOP;
END;
$$;

-- Function to validate organization member has required roles
CREATE OR REPLACE FUNCTION validate_organization_member_roles()
RETURNS TABLE(
  user_id uuid,
  email text,
  has_org_membership boolean,
  has_user_role boolean,
  issue_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id as user_id,
    au.email,
    (om.user_id IS NOT NULL) as has_org_membership,
    (ur.user_id IS NOT NULL) as has_user_role,
    CASE 
      WHEN om.user_id IS NOT NULL AND ur.user_id IS NULL THEN 'missing_user_role'
      WHEN om.user_id IS NULL AND ur.user_id IS NOT NULL THEN 'missing_org_membership'
      WHEN om.user_id IS NOT NULL AND ur.user_id IS NOT NULL THEN 'healthy'
      ELSE 'no_membership'
    END as issue_type
  FROM auth.users au
  LEFT JOIN organization_members om ON au.id = om.user_id AND om.status = 'active'
  LEFT JOIN user_roles ur ON au.id = ur.user_id
  WHERE au.email IS NOT NULL
  ORDER BY au.created_at DESC;
END;
$$;