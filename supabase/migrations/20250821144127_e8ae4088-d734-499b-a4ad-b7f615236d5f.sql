
-- 1) Allow assignees to read their own assignment rows
CREATE POLICY "Assignees can view their assignments"
ON public.form_assignees
FOR SELECT
USING (
  -- Carers/staff: assignment stored with staff.id
  EXISTS (
    SELECT 1
    FROM public.staff s
    WHERE s.auth_user_id = auth.uid()
      AND s.id = form_assignees.assignee_id
      AND form_assignees.assignee_type IN ('carer', 'staff')
  )
  OR
  -- Clients: assignment stored with clients.id
  EXISTS (
    SELECT 1
    FROM public.clients c
    WHERE c.auth_user_id = auth.uid()
      AND c.id = form_assignees.assignee_id
      AND form_assignees.assignee_type = 'client'
  )
);

-- 2) Allow assigned users to read form definitions
CREATE POLICY "Assigned users can view forms"
ON public.forms
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.form_assignees fa
    LEFT JOIN public.staff s
      ON fa.assignee_type IN ('carer','staff') AND s.id = fa.assignee_id
    LEFT JOIN public.clients c
      ON fa.assignee_type = 'client' AND c.id = fa.assignee_id
    WHERE fa.form_id = forms.id
      AND (
        (fa.assignee_type IN ('carer','staff') AND s.auth_user_id = auth.uid())
        OR (fa.assignee_type = 'client' AND c.auth_user_id = auth.uid())
      )
  )
);

-- 3) Allow assigned users to read form elements for their assigned forms
CREATE POLICY "Assigned users can view form elements"
ON public.form_elements
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.form_assignees fa
    LEFT JOIN public.staff s
      ON fa.assignee_type IN ('carer','staff') AND s.id = fa.assignee_id
    LEFT JOIN public.clients c
      ON fa.assignee_type = 'client' AND c.id = fa.assignee_id
    WHERE fa.form_id = form_elements.form_id
      AND (
        (fa.assignee_type IN ('carer','staff') AND s.auth_user_id = auth.uid())
        OR (fa.assignee_type = 'client' AND c.auth_user_id = auth.uid())
      )
  )
);
