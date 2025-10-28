-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Staff can insert task assignees" ON task_assignees;

-- Create new policy that checks branch context
CREATE POLICY "Staff can insert task assignees in their branch"
ON task_assignees
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM staff s
    INNER JOIN tasks t ON t.branch_id = s.branch_id
    WHERE s.auth_user_id = auth.uid()
      AND t.id = task_assignees.task_id
  )
);