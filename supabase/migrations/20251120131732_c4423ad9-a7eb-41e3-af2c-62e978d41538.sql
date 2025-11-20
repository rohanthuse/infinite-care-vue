-- Fix foreign key so deleting staff also deletes dependent tasks assignments
ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_assignee_id_fkey;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_assignee_id_fkey
  FOREIGN KEY (assignee_id)
  REFERENCES public.staff(id)
  ON DELETE CASCADE;