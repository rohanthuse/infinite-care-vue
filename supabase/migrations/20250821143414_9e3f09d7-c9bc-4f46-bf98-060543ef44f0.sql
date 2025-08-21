-- Drop existing policies that have incorrect auth logic
DROP POLICY IF EXISTS "Users can view tasks in their branches" ON public.tasks;
DROP POLICY IF EXISTS "Admins and staff can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins, staff and assignees can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins and assignees can delete tasks" ON public.tasks;

-- CREATE corrected SELECT policy for tasks
CREATE POLICY "Carers can view tasks (by branch or assignee)"
ON public.tasks
FOR SELECT
USING (
  public.has_role(auth.uid(), 'super_admin')
  OR EXISTS (
    SELECT 1 FROM public.admin_branches ab
    WHERE ab.branch_id = tasks.branch_id
      AND ab.admin_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.auth_user_id = auth.uid()
      AND s.branch_id = tasks.branch_id
  )
  OR tasks.assignee_id IN (
    SELECT s.id FROM public.staff s
    WHERE s.auth_user_id = auth.uid()
      AND s.branch_id = tasks.branch_id
  )
);

-- CREATE corrected INSERT policy for tasks
CREATE POLICY "Admins and staff can create tasks"
ON public.tasks
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin')
  OR EXISTS (
    SELECT 1 FROM public.admin_branches ab
    WHERE ab.branch_id = tasks.branch_id
      AND ab.admin_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.auth_user_id = auth.uid()
      AND s.branch_id = tasks.branch_id
  )
);

-- CREATE corrected UPDATE policy for tasks
CREATE POLICY "Admins, staff and assignees can update tasks"
ON public.tasks
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'super_admin')
  OR EXISTS (
    SELECT 1 FROM public.admin_branches ab
    WHERE ab.branch_id = tasks.branch_id
      AND ab.admin_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.auth_user_id = auth.uid()
      AND s.branch_id = tasks.branch_id
  )
  OR tasks.assignee_id IN (
    SELECT s.id FROM public.staff s
    WHERE s.auth_user_id = auth.uid()
      AND s.branch_id = tasks.branch_id
  )
);

-- CREATE corrected DELETE policy for tasks
CREATE POLICY "Admins and assignees can delete tasks"
ON public.tasks
FOR DELETE
USING (
  public.has_role(auth.uid(), 'super_admin')
  OR EXISTS (
    SELECT 1 FROM public.admin_branches ab
    WHERE ab.branch_id = tasks.branch_id
      AND ab.admin_id = auth.uid()
  )
  OR tasks.assignee_id IN (
    SELECT s.id FROM public.staff s
    WHERE s.auth_user_id = auth.uid()
      AND s.branch_id = tasks.branch_id
  )
);