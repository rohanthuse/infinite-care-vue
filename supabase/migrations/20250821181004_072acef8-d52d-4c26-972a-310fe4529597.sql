
-- 1) Function to determine if the current user is assigned to a form
CREATE OR REPLACE FUNCTION public.user_is_assigned_to_form(p_form_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_access boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.form_assignees fa
    LEFT JOIN public.staff s
      ON fa.assignee_type IN ('carer','staff') AND s.id = fa.assignee_id
    LEFT JOIN public.clients c
      ON fa.assignee_type = 'client' AND c.id = fa.assignee_id
    WHERE fa.form_id = p_form_id
      AND (
        (fa.assignee_type IN ('carer','staff') AND s.auth_user_id = auth.uid())
        OR (fa.assignee_type = 'client' AND c.auth_user_id = auth.uid())
      )
  ) INTO v_has_access;

  RETURN COALESCE(v_has_access, false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_is_assigned_to_form(uuid) TO authenticated;

-- 2) Replace forms SELECT policy to use the function (breaks recursion)
DROP POLICY IF EXISTS "Assigned users can view forms" ON public.forms;

CREATE POLICY "Assigned users can view forms (no recursion)"
ON public.forms
FOR SELECT
USING ( public.user_is_assigned_to_form(id) );

-- 3) Optional hardening: Function to determine if current user administers the form's branch
CREATE OR REPLACE FUNCTION public.form_is_in_admins_branch(p_form_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.forms f
    JOIN public.admin_branches ab ON ab.branch_id = f.branch_id
    WHERE f.id = p_form_id
      AND ab.admin_id = p_user_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.form_is_in_admins_branch(uuid, uuid) TO authenticated;

-- 4) Update form_assignees management policy to avoid referencing forms directly
DROP POLICY IF EXISTS "Users can manage assignees for their branch forms" ON public.form_assignees;

CREATE POLICY "Users can manage assignees for their branch forms (definer)"
ON public.form_assignees
FOR ALL
USING (
  public.has_role(auth.uid(), 'super_admin')
  OR public.form_is_in_admins_branch(form_id, auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin')
  OR public.form_is_in_admins_branch(form_id, auth.uid())
);
