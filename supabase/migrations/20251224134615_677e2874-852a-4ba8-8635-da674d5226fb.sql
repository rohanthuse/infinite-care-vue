-- Add LPA and legal directive columns to client_personal_info table
ALTER TABLE public.client_personal_info 
ADD COLUMN IF NOT EXISTS has_key_safe boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_lpa boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS lpa_type text,
ADD COLUMN IF NOT EXISTS lpa_holder_name text,
ADD COLUMN IF NOT EXISTS lpa_holder_phone text,
ADD COLUMN IF NOT EXISTS lpa_holder_email text,
ADD COLUMN IF NOT EXISTS has_dnr boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_respect boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_dols boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS life_history text,
ADD COLUMN IF NOT EXISTS personality_traits text,
ADD COLUMN IF NOT EXISTS communication_style text,
ADD COLUMN IF NOT EXISTS how_i_communicate text,
ADD COLUMN IF NOT EXISTS how_to_communicate_with_me text,
ADD COLUMN IF NOT EXISTS vision_description text,
ADD COLUMN IF NOT EXISTS hearing_description text;