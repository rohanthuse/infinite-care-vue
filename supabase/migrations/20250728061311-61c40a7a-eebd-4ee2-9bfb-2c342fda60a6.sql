-- Add missing created_by column to extra_time_records table
ALTER TABLE public.extra_time_records 
ADD COLUMN created_by uuid;