-- Drop existing function and recreate with correct parameters
DROP FUNCTION IF EXISTS public.user_has_access_to_org(uuid, uuid);

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