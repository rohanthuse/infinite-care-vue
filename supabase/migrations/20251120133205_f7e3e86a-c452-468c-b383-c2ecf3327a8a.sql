-- Fix foreign key so deleting branches also deletes dependent library resource access logs
ALTER TABLE public.library_resource_access_logs
  DROP CONSTRAINT IF EXISTS library_resource_access_logs_branch_id_fkey;

ALTER TABLE public.library_resource_access_logs
  ADD CONSTRAINT library_resource_access_logs_branch_id_fkey
  FOREIGN KEY (branch_id)
  REFERENCES public.branches(id)
  ON DELETE CASCADE;