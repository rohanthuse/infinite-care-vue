-- Fix RLS infinite recursion by recreating helper functions with proper settings
-- and replacing recursive policy on user_roles table

-- Step 1: Recreate has_role function with proper SQL settings to bypass RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Step 2: Recreate user_is_admin function with proper SQL settings to bypass RLS
CREATE OR REPLACE FUNCTION public.user_is_admin(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_id_param 
    AND role IN ('super_admin', 'branch_admin')
  )
$$;

-- Step 3: Drop the recursive policy on user_roles
DROP POLICY IF EXISTS "Super admins can manage user roles" ON user_roles;

-- Step 4: Create non-recursive policy using direct subquery instead of function
-- This avoids infinite recursion by using a direct query instead of calling has_role()
CREATE POLICY "Super admins can manage user roles"
ON user_roles
FOR ALL
TO authenticated
USING (
  auth.uid() = user_id 
  OR auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'super_admin')
)
WITH CHECK (
  auth.uid() = user_id 
  OR auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'super_admin')
);

-- Step 5: Ensure proper grants on helper functions
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.user_is_admin(uuid) TO authenticated, anon, service_role;

-- Add comment for documentation
COMMENT ON FUNCTION public.has_role(uuid, app_role) IS 'Security definer function to check user role without triggering RLS recursion';
COMMENT ON FUNCTION public.user_is_admin(uuid) IS 'Security definer function to check if user is admin without triggering RLS recursion';