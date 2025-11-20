-- Fix foreign key so deleting clients also deletes dependent scheduled_agreements
ALTER TABLE public.scheduled_agreements
  DROP CONSTRAINT IF EXISTS scheduled_agreements_scheduled_with_client_id_fkey;

ALTER TABLE public.scheduled_agreements
  ADD CONSTRAINT scheduled_agreements_scheduled_with_client_id_fkey
  FOREIGN KEY (scheduled_with_client_id)
  REFERENCES public.clients(id)
  ON DELETE CASCADE;