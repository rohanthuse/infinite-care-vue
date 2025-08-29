-- Drop and recreate the function with correct parameters
DROP FUNCTION IF EXISTS public.get_user_primary_org_slug(uuid);

CREATE OR REPLACE FUNCTION public.get_user_primary_org_slug(user_id_param uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
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