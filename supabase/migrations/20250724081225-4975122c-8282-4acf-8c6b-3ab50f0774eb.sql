-- Add the missing created_by column to scheduled_agreements table
ALTER TABLE public.scheduled_agreements 
ADD COLUMN created_by UUID REFERENCES auth.users(id);