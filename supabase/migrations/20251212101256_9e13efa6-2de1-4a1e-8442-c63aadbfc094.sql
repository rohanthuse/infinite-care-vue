-- Add RLS policy for staff to view admin profiles for messaging
CREATE POLICY "Staff can view admin profiles for messaging"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM staff s WHERE s.auth_user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1
    FROM admin_branches ab
    JOIN branches b ON ab.branch_id = b.id
    JOIN staff s ON s.auth_user_id = auth.uid()
    JOIN branches staff_branch ON staff_branch.id = s.branch_id
    WHERE ab.admin_id = profiles.id
    AND b.organization_id = staff_branch.organization_id
  )
);

-- Drop the existing limited policy on admin_branches
DROP POLICY IF EXISTS "Staff can view branch admins for messaging" ON admin_branches;

-- Create improved policy that shows all admins in the organization
CREATE POLICY "Staff can view organization admin-branch relations for messaging"
ON public.admin_branches
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM staff s
    JOIN branches staff_branch ON staff_branch.id = s.branch_id
    JOIN branches b ON b.organization_id = staff_branch.organization_id
    WHERE s.auth_user_id = auth.uid()
    AND b.id = admin_branches.branch_id
  )
);