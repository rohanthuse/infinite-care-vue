-- Create helper function to check if current user is staff (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_staff_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.staff
    WHERE auth_user_id = auth.uid()
  );
END;
$$;

-- Create helper function to get current staff member's branch_id (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.get_staff_branch_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN (
    SELECT branch_id
    FROM public.staff
    WHERE auth_user_id = auth.uid()
    LIMIT 1
  );
END;
$$;

-- Drop and recreate the problematic policy on user_roles
DROP POLICY IF EXISTS "Staff can view admin roles for messaging" ON user_roles;

CREATE POLICY "Staff can view admin roles for messaging"
ON user_roles
FOR SELECT
TO authenticated
USING (
  -- Use SECURITY DEFINER function to check if user is staff (avoids recursion)
  public.is_staff_user() AND
  -- Check if the role being viewed is an admin role for the same organization
  EXISTS (
    SELECT 1 
    FROM admin_branches ab
    JOIN branches b ON ab.branch_id = b.id
    JOIN branches staff_branch ON staff_branch.id = public.get_staff_branch_id()
    WHERE ab.admin_id = user_roles.user_id
    AND b.organization_id = staff_branch.organization_id
    AND user_roles.role IN ('branch_admin', 'super_admin')
  )
);

-- Drop and recreate the policy on admin_branches
DROP POLICY IF EXISTS "Staff can view branch admins for messaging" ON admin_branches;

CREATE POLICY "Staff can view branch admins for messaging"
ON admin_branches
FOR SELECT
TO authenticated
USING (
  branch_id = public.get_staff_branch_id()
);