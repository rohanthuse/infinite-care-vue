-- Add missing columns to client_medications table for full medication details
ALTER TABLE public.client_medications 
ADD COLUMN IF NOT EXISTS shape TEXT,
ADD COLUMN IF NOT EXISTS route TEXT,
ADD COLUMN IF NOT EXISTS who_administers TEXT,
ADD COLUMN IF NOT EXISTS level TEXT,
ADD COLUMN IF NOT EXISTS warning TEXT,
ADD COLUMN IF NOT EXISTS side_effect TEXT,
ADD COLUMN IF NOT EXISTS instruction TEXT;