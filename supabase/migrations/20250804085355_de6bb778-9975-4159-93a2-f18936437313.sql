-- Add visit_photos column to visit_records table to store photo URLs
ALTER TABLE public.visit_records 
ADD COLUMN visit_photos jsonb DEFAULT '[]'::jsonb;