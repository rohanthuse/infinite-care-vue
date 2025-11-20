-- Fix create_organization_member_with_role function to stop auto-creating system roles
-- Organization members should NOT have system roles (carer, branch_admin, etc.)
-- System roles are for specific functional roles only

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
SET search_path = public
AS $$
DECLARE
  member_id uuid;
BEGIN
  -- Create organization member ONLY
  -- Do NOT create system roles in user_roles table
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
  
  -- REMOVED: Automatic user_roles insertion
  -- Organization members should NOT have system roles (carer, branch_admin, etc.)
  -- System roles are for specific functional roles:
  --   - 'carer' = staff members in staff table
  --   - 'branch_admin' = admins in admin_branches table  
  --   - 'client' = clients in clients table
  -- Organization members are a SEPARATE concept with their own permissions
  
  RETURN member_id;
END;
$$;

COMMENT ON FUNCTION create_organization_member_with_role IS 
  'Creates organization member WITHOUT creating system roles. Organization membership is distinct from system roles (carer, branch_admin, client).';
