-- Fix infinite recursion in RLS policies by adding SECURITY DEFINER to role-checking functions

-- Step 1: Create SECURITY DEFINER function for role checking
CREATE OR REPLACE FUNCTION public.has_role_definer(
  _user_id uuid, 
  _role app_role
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 2: Update is_system_admin to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_system_admin(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_id_param 
    AND role = 'super_admin'::app_role
  )
$$;

-- Step 3: Update user_is_admin to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.user_is_admin(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_id_param 
    AND role IN ('super_admin', 'branch_admin')
  )
$$;

-- Step 4: Update is_authenticated_admin to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_authenticated_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
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