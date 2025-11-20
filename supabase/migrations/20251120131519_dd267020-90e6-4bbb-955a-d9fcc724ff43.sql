-- Fix foreign key so deleting clients also deletes dependent tasks
ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_client_id_fkey;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_client_id_fkey
  FOREIGN KEY (client_id)
  REFERENCES public.clients(id)
  ON DELETE CASCADE;