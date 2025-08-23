
-- 1) Fix RLS on news2_observations to use current_user_branch_ids()

-- Drop old/duplicate staff/admin policies that relied on staff.id = auth.uid()
DROP POLICY IF EXISTS "Branch staff can insert news2 observations" ON public.news2_observations;
DROP POLICY IF EXISTS "Branch staff can update news2 observations" ON public.news2_observations;
DROP POLICY IF EXISTS "Branch staff can select news2 observations" ON public.news2_observations;
DROP POLICY IF EXISTS "Branch staff can view news2 observations" ON public.news2_observations;

-- Keep existing client policy as-is (not dropped here)

-- Recreate branch staff/admin policies with correct branch mapping
CREATE POLICY "Branch staff can insert news2 observations"
ON public.news2_observations
FOR INSERT
WITH CHECK (
  news2_patient_id IN (
    SELECT np.id
    FROM public.news2_patients np
    WHERE np.branch_id IN (SELECT branch_id FROM public.current_user_branch_ids())
  )
);

CREATE POLICY "Branch staff can update news2 observations"
ON public.news2_observations
FOR UPDATE
USING (
  news2_patient_id IN (
    SELECT np.id
    FROM public.news2_patients np
    WHERE np.branch_id IN (SELECT branch_id FROM public.current_user_branch_ids())
  )
);

CREATE POLICY "Branch staff can select news2 observations"
ON public.news2_observations
FOR SELECT
USING (
  news2_patient_id IN (
    SELECT np.id
    FROM public.news2_patients np
    WHERE np.branch_id IN (SELECT branch_id FROM public.current_user_branch_ids())
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'::app_role
  )
);

-- 2) Add a BEFORE INSERT trigger to safely set recorded_by_staff_id
--    - If frontend sends NULL or mistakenly sends auth.uid(), we correct it to the staff.id

CREATE OR REPLACE FUNCTION public.set_news2_observation_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_staff_id uuid;
BEGIN
  -- Resolve the staff record for the current authenticated user
  SELECT s.id INTO v_staff_id
  FROM public.staff s
  WHERE s.auth_user_id = auth.uid()
  LIMIT 1;

  -- If we found a staff record, set or correct recorded_by_staff_id
  IF v_staff_id IS NOT NULL THEN
    IF NEW.recorded_by_staff_id IS NULL OR NEW.recorded_by_staff_id = auth.uid() THEN
      NEW.recorded_by_staff_id := v_staff_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_set_news2_observation_defaults ON public.news2_observations;

CREATE TRIGGER trg_set_news2_observation_defaults
BEFORE INSERT ON public.news2_observations
FOR EACH ROW
EXECUTE FUNCTION public.set_news2_observation_defaults();

-- 3) Fix RLS on news2_alerts (alerts are created by trigger after inserting observations)

DROP POLICY IF EXISTS "Branch staff can insert news2 alerts" ON public.news2_alerts;
DROP POLICY IF EXISTS "Branch staff can select news2 alerts" ON public.news2_alerts;
DROP POLICY IF EXISTS "Branch staff can view news2 alerts" ON public.news2_alerts;

CREATE POLICY "Branch staff can insert news2 alerts"
ON public.news2_alerts
FOR INSERT
WITH CHECK (
  news2_patient_id IN (
    SELECT np.id
    FROM public.news2_patients np
    WHERE np.branch_id IN (SELECT branch_id FROM public.current_user_branch_ids())
  )
);

CREATE POLICY "Branch staff can select news2 alerts"
ON public.news2_alerts
FOR SELECT
USING (
  news2_patient_id IN (
    SELECT np.id
    FROM public.news2_patients np
    WHERE np.branch_id IN (SELECT branch_id FROM public.current_user_branch_ids())
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'::app_role
  )
);
