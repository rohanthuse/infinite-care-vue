-- Fix foreign key on scheduled_agreements to allow cascading deletes when staff is deleted
ALTER TABLE public.scheduled_agreements
  DROP CONSTRAINT IF EXISTS scheduled_agreements_scheduled_with_staff_id_fkey;

ALTER TABLE public.scheduled_agreements
  ADD CONSTRAINT scheduled_agreements_scheduled_with_staff_id_fkey
  FOREIGN KEY (scheduled_with_staff_id)
  REFERENCES public.staff(id)
  ON DELETE CASCADE;

-- Re-apply expenses constraint to ensure CASCADE is properly set
ALTER TABLE public.expenses
  DROP CONSTRAINT IF EXISTS expenses_created_by_fkey;

ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.staff(id)
  ON DELETE CASCADE;