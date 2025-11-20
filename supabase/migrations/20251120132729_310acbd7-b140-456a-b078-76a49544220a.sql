-- Fix foreign key so deleting branches also deletes dependent training courses
ALTER TABLE public.training_courses
  DROP CONSTRAINT IF EXISTS training_courses_branch_id_fkey;

ALTER TABLE public.training_courses
  ADD CONSTRAINT training_courses_branch_id_fkey
  FOREIGN KEY (branch_id)
  REFERENCES public.branches(id)
  ON DELETE CASCADE;