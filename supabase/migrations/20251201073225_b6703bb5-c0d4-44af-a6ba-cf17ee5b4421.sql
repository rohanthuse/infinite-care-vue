-- Fix security definer functions to prevent RLS bypass issues during login
-- Add SET search_path TO 'public' to critical authentication functions

-- Fix user_belongs_to_organization function
CREATE OR REPLACE FUNCTION public.user_belongs_to_organization(org_id uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_members 
    WHERE organization_id = org_id AND user_id = user_id_param AND status = 'active'
  );
$$;

-- Fix is_system_admin function
CREATE OR REPLACE FUNCTION public.is_system_admin(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_id_param 
    AND role = 'super_admin'::app_role
  );
$$;

-- Fix is_authenticated_admin function  
CREATE OR REPLACE FUNCTION public.is_authenticated_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  system_user_id uuid;
  is_standard_admin boolean := false;
  is_system_admin boolean := false;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    ) INTO is_standard_admin;
  END IF;
  
  system_user_id := get_current_system_user_id();
  IF system_user_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.system_user_roles
      WHERE system_user_id = system_user_id AND role = 'super_admin'
    ) INTO is_system_admin;
  END IF;
  
  RETURN is_standard_admin OR is_system_admin;
END;
$$;

-- Ensure proper grants
GRANT EXECUTE ON FUNCTION public.user_belongs_to_organization(uuid, uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_system_admin(uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_authenticated_admin() TO authenticated, anon, service_role;

-- Add comments for documentation
COMMENT ON FUNCTION public.user_belongs_to_organization(uuid, uuid) IS 'Security definer function to check organization membership without triggering RLS recursion';
COMMENT ON FUNCTION public.is_system_admin(uuid) IS 'Security definer function to check super admin status without triggering RLS recursion';
COMMENT ON FUNCTION public.is_authenticated_admin() IS 'Security definer function to check admin authentication without triggering RLS recursion';