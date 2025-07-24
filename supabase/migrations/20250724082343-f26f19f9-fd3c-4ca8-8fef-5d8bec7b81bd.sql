-- Fix foreign key constraints for scheduled_agreements table
-- Drop existing problematic foreign key constraints
ALTER TABLE public.scheduled_agreements 
DROP CONSTRAINT IF EXISTS scheduled_agreements_scheduled_with_client_id_fkey;

ALTER TABLE public.scheduled_agreements 
DROP CONSTRAINT IF EXISTS scheduled_agreements_scheduled_with_staff_id_fkey;

-- Add correct foreign key constraints that reference the right tables
ALTER TABLE public.scheduled_agreements 
ADD CONSTRAINT scheduled_agreements_scheduled_with_client_id_fkey 
FOREIGN KEY (scheduled_with_client_id) REFERENCES public.clients(id);

ALTER TABLE public.scheduled_agreements 
ADD CONSTRAINT scheduled_agreements_scheduled_with_staff_id_fkey 
FOREIGN KEY (scheduled_with_staff_id) REFERENCES public.staff(id);