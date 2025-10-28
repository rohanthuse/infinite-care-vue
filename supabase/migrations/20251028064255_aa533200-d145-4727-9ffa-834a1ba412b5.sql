-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Staff can insert task assignees in their branch" ON task_assignees;

-- Create new policy that allows admins and staff to insert task assignees
CREATE POLICY "Admins and staff can insert task assignees"
ON task_assignees
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow super_admins and branch_admins to assign anyone to any task
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_role(auth.uid(), 'branch_admin'::app_role)
  OR
  -- Allow staff to assign staff in their branch
  EXISTS (
    SELECT 1 
    FROM staff s
    INNER JOIN tasks t ON t.branch_id = s.branch_id
    WHERE s.auth_user_id = auth.uid()
      AND t.id = task_assignees.task_id
  )
);