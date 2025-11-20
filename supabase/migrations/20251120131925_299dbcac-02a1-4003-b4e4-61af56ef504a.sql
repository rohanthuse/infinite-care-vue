-- Fix foreign key so deleting staff also deletes dependent training records
ALTER TABLE public.staff_training_records
  DROP CONSTRAINT IF EXISTS staff_training_records_staff_id_fkey;

ALTER TABLE public.staff_training_records
  ADD CONSTRAINT staff_training_records_staff_id_fkey
  FOREIGN KEY (staff_id)
  REFERENCES public.staff(id)
  ON DELETE CASCADE;