-- Update RLS policy to allow carers to delete their own assigned tasks
DROP POLICY IF EXISTS "Admins can delete tasks" ON public.tasks;

CREATE POLICY "Admins and assignees can delete tasks" 
ON public.tasks 
FOR DELETE 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR (EXISTS ( 
    SELECT 1
    FROM admin_branches ab
    WHERE ((ab.branch_id = tasks.branch_id) AND (ab.admin_id = auth.uid()))
  ))
  OR (assignee_id = auth.uid())
);