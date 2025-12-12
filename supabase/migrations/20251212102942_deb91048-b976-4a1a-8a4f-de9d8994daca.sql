-- Phase 1: Drop the problematic policies causing infinite recursion
DROP POLICY IF EXISTS "Staff can view admin profiles for messaging" ON profiles;
DROP POLICY IF EXISTS "Staff can view organization admin-branch relations for messaging" ON admin_branches;

-- Phase 2: Create SECURITY DEFINER helper functions to avoid RLS recursion

-- Helper function to get staff branch_id safely (bypasses RLS)
CREATE OR REPLACE FUNCTION get_staff_branch_id_safe()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT branch_id FROM staff 
  WHERE auth_user_id = auth.uid() 
  LIMIT 1
$$;

-- Helper function to get staff organization_id safely (bypasses RLS)
CREATE OR REPLACE FUNCTION get_staff_organization_id_safe()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.organization_id 
  FROM staff s
  JOIN branches b ON s.branch_id = b.id
  WHERE s.auth_user_id = auth.uid() 
  LIMIT 1
$$;

-- Helper function to check if user is staff safely (bypasses RLS)
CREATE OR REPLACE FUNCTION is_staff_user_safe()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff WHERE auth_user_id = auth.uid()
  )
$$;

-- Phase 3: Create new non-recursive policies using the helper functions

-- Policy for admin_branches: Staff can view admin-branch relations in their organization
CREATE POLICY "Staff can view organization admin-branch relations v2"
ON public.admin_branches
FOR SELECT
USING (
  is_staff_user_safe()
  AND EXISTS (
    SELECT 1
    FROM branches b
    WHERE b.id = admin_branches.branch_id
    AND b.organization_id = get_staff_organization_id_safe()
  )
);

-- Policy for profiles: Staff can view admin profiles for messaging
CREATE POLICY "Staff can view admin profiles for messaging v2"
ON public.profiles
FOR SELECT
USING (
  is_staff_user_safe()
  AND EXISTS (
    SELECT 1
    FROM admin_branches ab
    JOIN branches b ON ab.branch_id = b.id
    WHERE ab.admin_id = profiles.id
    AND b.organization_id = get_staff_organization_id_safe()
  )
);