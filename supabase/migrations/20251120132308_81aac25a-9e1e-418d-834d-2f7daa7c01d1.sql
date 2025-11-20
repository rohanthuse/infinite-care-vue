-- Fix foreign key so deleting staff also deletes or nullifies dependent expenses
ALTER TABLE public.expenses
  DROP CONSTRAINT IF EXISTS expenses_created_by_fkey;

ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.staff(id)
  ON DELETE CASCADE;