-- Fix RLS policies for visit vitals to allow carers to manage their visit data
DROP POLICY IF EXISTS "Branch staff can manage visit vitals" ON public.visit_vitals;

CREATE POLICY "Branch staff can manage visit vitals" ON public.visit_vitals
FOR ALL
USING (
  visit_record_id IN (
    SELECT vr.id
    FROM visit_records vr
    WHERE vr.branch_id IN (
      SELECT s.branch_id
      FROM staff s
      WHERE s.auth_user_id = auth.uid()
      UNION
      SELECT ab.branch_id
      FROM admin_branches ab
      WHERE ab.admin_id = auth.uid()
    )
  )
)
WITH CHECK (
  visit_record_id IN (
    SELECT vr.id
    FROM visit_records vr
    WHERE vr.branch_id IN (
      SELECT s.branch_id
      FROM staff s
      WHERE s.auth_user_id = auth.uid()
      UNION
      SELECT ab.branch_id
      FROM admin_branches ab
      WHERE ab.admin_id = auth.uid()
    )
  )
);

-- Fix RLS policies for visit tasks
DROP POLICY IF EXISTS "Branch staff can manage visit tasks" ON public.visit_tasks;

CREATE POLICY "Branch staff can manage visit tasks" ON public.visit_tasks
FOR ALL
USING (
  visit_record_id IN (
    SELECT vr.id
    FROM visit_records vr
    WHERE vr.branch_id IN (
      SELECT s.branch_id
      FROM staff s
      WHERE s.auth_user_id = auth.uid()
      UNION
      SELECT ab.branch_id
      FROM admin_branches ab
      WHERE ab.admin_id = auth.uid()
    )
  )
)
WITH CHECK (
  visit_record_id IN (
    SELECT vr.id
    FROM visit_records vr
    WHERE vr.branch_id IN (
      SELECT s.branch_id
      FROM staff s
      WHERE s.auth_user_id = auth.uid()
      UNION
      SELECT ab.branch_id
      FROM admin_branches ab
      WHERE ab.admin_id = auth.uid()
    )
  )
);

-- Fix RLS policies for visit medications
DROP POLICY IF EXISTS "Branch staff can manage visit medications" ON public.visit_medications;

CREATE POLICY "Branch staff can manage visit medications" ON public.visit_medications
FOR ALL
USING (
  visit_record_id IN (
    SELECT vr.id
    FROM visit_records vr
    WHERE vr.branch_id IN (
      SELECT s.branch_id
      FROM staff s
      WHERE s.auth_user_id = auth.uid()
      UNION
      SELECT ab.branch_id
      FROM admin_branches ab
      WHERE ab.admin_id = auth.uid()
    )
  )
)
WITH CHECK (
  visit_record_id IN (
    SELECT vr.id
    FROM visit_records vr
    WHERE vr.branch_id IN (
      SELECT s.branch_id
      FROM staff s
      WHERE s.auth_user_id = auth.uid()
      UNION
      SELECT ab.branch_id
      FROM admin_branches ab
      WHERE ab.admin_id = auth.uid()
    )
  )
);