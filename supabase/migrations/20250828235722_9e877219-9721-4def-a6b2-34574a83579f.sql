-- Re-implement optimized RPC functions that were lost in the revert

-- Function to check if user has access to a specific organization
CREATE OR REPLACE FUNCTION public.user_has_access_to_org(user_id_param uuid, org_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is super admin (has access to all orgs)
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_id_param AND role = 'super_admin'
  ) THEN 
    RETURN true;
  END IF;
  
  -- Check if user is a client in this organization (via branch)
  IF EXISTS (
    SELECT 1 FROM public.clients c
    JOIN public.branches b ON c.branch_id = b.id
    WHERE c.auth_user_id = user_id_param 
    AND b.organization_id = org_id_param
  ) THEN
    RETURN true;
  END IF;
  
  -- Check if user is a carer/staff in this organization (via branch)
  IF EXISTS (
    SELECT 1 FROM public.staff s
    JOIN public.branches b ON s.branch_id = b.id
    WHERE s.auth_user_id = user_id_param 
    AND b.organization_id = org_id_param
    AND s.status = 'Active'
  ) THEN
    RETURN true;
  END IF;
  
  -- Check if user is an organization member
  IF EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id_param 
    AND user_id = user_id_param 
    AND status = 'active'
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Function to get user's primary organization slug (for faster tenant resolution)
CREATE OR REPLACE FUNCTION public.get_user_primary_org_slug(user_id_param uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  org_slug text;
BEGIN
  -- For super admins, return null (they can access any org)
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_id_param AND role = 'super_admin'
  ) THEN 
    RETURN null;
  END IF;
  
  -- Try to get organization from client relationship
  SELECT o.slug INTO org_slug
  FROM public.clients c
  JOIN public.branches b ON c.branch_id = b.id
  JOIN public.organizations o ON b.organization_id = o.id
  WHERE c.auth_user_id = user_id_param
  LIMIT 1;
  
  IF org_slug IS NOT NULL THEN
    RETURN org_slug;
  END IF;
  
  -- Try to get organization from staff relationship
  SELECT o.slug INTO org_slug
  FROM public.staff s
  JOIN public.branches b ON s.branch_id = b.id
  JOIN public.organizations o ON b.organization_id = o.id
  WHERE s.auth_user_id = user_id_param
  AND s.status = 'Active'
  LIMIT 1;
  
  IF org_slug IS NOT NULL THEN
    RETURN org_slug;
  END IF;
  
  -- Try to get organization from organization members
  SELECT o.slug INTO org_slug
  FROM public.organization_members om
  JOIN public.organizations o ON om.organization_id = o.id
  WHERE om.user_id = user_id_param
  AND om.status = 'active'
  LIMIT 1;
  
  RETURN org_slug;
END;
$$;

-- Add database indexes for faster queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_user_id_role ON public.user_roles(user_id, role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_auth_user_branch ON public.clients(auth_user_id, branch_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_staff_auth_user_branch ON public.staff(auth_user_id, branch_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organization_members_user_org ON public.organization_members(user_id, organization_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_branches_organization_id ON public.branches(organization_id);