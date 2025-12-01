-- Drop the recursive policy that's causing infinite recursion
DROP POLICY IF EXISTS "Super admins can manage user roles" ON user_roles;

-- Create non-recursive policy using SECURITY DEFINER function
-- is_system_admin() bypasses RLS because it's SECURITY DEFINER with SET search_path
CREATE POLICY "Super admins can manage user roles"
ON user_roles
FOR ALL
TO authenticated
USING (
  auth.uid() = user_id 
  OR public.is_system_admin(auth.uid())
)
WITH CHECK (
  auth.uid() = user_id 
  OR public.is_system_admin(auth.uid())
);