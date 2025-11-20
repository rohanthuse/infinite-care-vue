-- Fix foreign key so deleting client_care_plans also deletes dependent assessments
ALTER TABLE public.client_assessments
  DROP CONSTRAINT IF EXISTS client_assessments_care_plan_id_fkey;

ALTER TABLE public.client_assessments
  ADD CONSTRAINT client_assessments_care_plan_id_fkey
  FOREIGN KEY (care_plan_id)
  REFERENCES public.client_care_plans(id)
  ON DELETE CASCADE;