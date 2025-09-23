-- Add foreign key constraints to client_service_reports table
ALTER TABLE public.client_service_reports 
ADD CONSTRAINT fk_client_service_reports_client_id 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.client_service_reports 
ADD CONSTRAINT fk_client_service_reports_staff_id 
FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE CASCADE;

ALTER TABLE public.client_service_reports 
ADD CONSTRAINT fk_client_service_reports_branch_id 
FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;