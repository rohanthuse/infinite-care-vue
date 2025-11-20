-- Fix foreign key so deleting branches also deletes dependent tasks
ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_branch_id_fkey;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_branch_id_fkey
  FOREIGN KEY (branch_id)
  REFERENCES public.branches(id)
  ON DELETE CASCADE;