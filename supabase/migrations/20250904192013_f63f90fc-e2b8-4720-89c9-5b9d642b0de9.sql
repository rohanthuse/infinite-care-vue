-- Add new fields to client_medical_info for physical and mental health conditions
ALTER TABLE public.client_medical_info 
ADD COLUMN IF NOT EXISTS physical_health_conditions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS mental_health_conditions TEXT[] DEFAULT '{}';