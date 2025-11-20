-- Fix foreign key so deleting visit_records also deletes dependent service reports
ALTER TABLE public.client_service_reports
  DROP CONSTRAINT IF EXISTS client_service_reports_visit_record_id_fkey;

ALTER TABLE public.client_service_reports
  ADD CONSTRAINT client_service_reports_visit_record_id_fkey
  FOREIGN KEY (visit_record_id)
  REFERENCES public.visit_records(id)
  ON DELETE CASCADE;