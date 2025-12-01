-- Add RLS policy for staff to view branch admins for messaging
CREATE POLICY "Staff can view branch admins for messaging"
ON admin_branches
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM staff s
    WHERE s.auth_user_id = auth.uid()
    AND s.branch_id = admin_branches.branch_id
  )
);

-- Add RLS policy for staff to view admin roles for messaging
CREATE POLICY "Staff can view admin roles for messaging"
ON user_roles
FOR SELECT
TO authenticated
USING (
  -- Allow if the user being checked is an admin in any branch of the same organization
  EXISTS (
    SELECT 1 
    FROM staff s
    JOIN branches b ON s.branch_id = b.id
    JOIN admin_branches ab ON ab.branch_id IN (
      SELECT id FROM branches WHERE organization_id = b.organization_id
    )
    WHERE s.auth_user_id = auth.uid()
    AND ab.admin_id = user_roles.user_id
    AND user_roles.role IN ('branch_admin', 'super_admin')
  )
);