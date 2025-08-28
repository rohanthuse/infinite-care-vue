-- Performance optimization: Add indexes for faster login queries

-- Index for organization_members lookups
CREATE INDEX IF NOT EXISTS idx_organization_members_user_status 
ON organization_members(user_id, status, joined_at DESC) 
WHERE status = 'active';

-- Index for admin_branches lookups
CREATE INDEX IF NOT EXISTS idx_admin_branches_admin_id 
ON admin_branches(admin_id);

-- Index for staff auth_user_id lookups (most critical for carer login)
CREATE INDEX IF NOT EXISTS idx_staff_auth_user_status 
ON staff(auth_user_id, status) 
WHERE status = 'Active';

-- Index for clients auth_user_id lookups (most critical for client login)
CREATE INDEX IF NOT EXISTS idx_clients_auth_user_id 
ON clients(auth_user_id) 
WHERE auth_user_id IS NOT NULL;

-- Index for branches organization_id lookups
CREATE INDEX IF NOT EXISTS idx_branches_organization_id 
ON branches(organization_id);

-- Index for organizations slug lookups
CREATE INDEX IF NOT EXISTS idx_organizations_slug 
ON organizations(slug);

-- Create unified RPC function for fast organization slug detection
CREATE OR REPLACE FUNCTION public.get_user_primary_org_slug(p_user_id uuid)
RETURNS TEXT
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  org_slug TEXT;
BEGIN
  -- First check organization_members (fastest path for most users)
  SELECT o.slug INTO org_slug
  FROM organization_members om
  JOIN organizations o ON o.id = om.organization_id
  WHERE om.user_id = p_user_id 
    AND om.status = 'active'
  ORDER BY 
    CASE om.role 
      WHEN 'owner' THEN 1 
      WHEN 'admin' THEN 2 
      WHEN 'member' THEN 3 
      ELSE 999 
    END,
    om.joined_at DESC
  LIMIT 1;
  
  IF org_slug IS NOT NULL THEN
    RETURN org_slug;
  END IF;

  -- Check admin_branches (for branch admins)
  SELECT o.slug INTO org_slug
  FROM admin_branches ab
  JOIN branches b ON b.id = ab.branch_id
  JOIN organizations o ON o.id = b.organization_id
  WHERE ab.admin_id = p_user_id
  LIMIT 1;
  
  IF org_slug IS NOT NULL THEN
    RETURN org_slug;
  END IF;

  -- Check staff table (for carers)
  SELECT o.slug INTO org_slug
  FROM staff s
  JOIN branches b ON b.id = s.branch_id
  JOIN organizations o ON o.id = b.organization_id
  WHERE s.auth_user_id = p_user_id AND s.status = 'Active'
  LIMIT 1;
  
  IF org_slug IS NOT NULL THEN
    RETURN org_slug;
  END IF;

  -- Check clients table (for clients)
  SELECT o.slug INTO org_slug
  FROM clients c
  JOIN branches b ON b.id = c.branch_id
  JOIN organizations o ON o.id = b.organization_id
  WHERE c.auth_user_id = p_user_id
  LIMIT 1;
  
  RETURN org_slug;
END;
$$;