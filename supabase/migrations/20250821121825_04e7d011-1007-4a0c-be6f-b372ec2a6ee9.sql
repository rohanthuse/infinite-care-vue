
-- Enable RLS on visit_events (idempotent)
ALTER TABLE public.visit_events ENABLE ROW LEVEL SECURITY;

-- Replace existing broad or incorrect policy with a branch-scoped one
DROP POLICY IF EXISTS "Branch staff can manage visit events" ON public.visit_events;

CREATE POLICY "Branch staff can manage visit events" ON public.visit_events
FOR ALL
USING (
  visit_record_id IN (
    SELECT vr.id
    FROM public.visit_records vr
    WHERE vr.branch_id IN (
      SELECT s.branch_id
      FROM public.staff s
      WHERE s.auth_user_id = auth.uid()
      UNION
      SELECT ab.branch_id
      FROM public.admin_branches ab
      WHERE ab.admin_id = auth.uid()
    )
  )
)
WITH CHECK (
  visit_record_id IN (
    SELECT vr.id
    FROM public.visit_records vr
    WHERE vr.branch_id IN (
      SELECT s.branch_id
      FROM public.staff s
      WHERE s.auth_user_id = auth.uid()
      UNION
      SELECT ab.branch_id
      FROM public.admin_branches ab
      WHERE ab.admin_id = auth.uid()
    )
  )
);
