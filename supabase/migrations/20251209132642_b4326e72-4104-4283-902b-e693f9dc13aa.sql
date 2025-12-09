-- Add vat_rate column to client_rate_schedules table
ALTER TABLE public.client_rate_schedules 
ADD COLUMN IF NOT EXISTS vat_rate numeric DEFAULT 20;