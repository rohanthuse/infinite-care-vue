-- Add missing columns to client_personal_info table to match TypeScript interface

-- Background & Identity Fields
ALTER TABLE public.client_personal_info
ADD COLUMN IF NOT EXISTS ethnicity TEXT,
ADD COLUMN IF NOT EXISTS sexual_orientation TEXT,
ADD COLUMN IF NOT EXISTS gender_identity TEXT,
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS primary_language TEXT,
ADD COLUMN IF NOT EXISTS interpreter_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS preferred_interpreter_language TEXT;

-- My Home Fields
ALTER TABLE public.client_personal_info
ADD COLUMN IF NOT EXISTS property_type TEXT,
ADD COLUMN IF NOT EXISTS living_arrangement TEXT,
ADD COLUMN IF NOT EXISTS home_accessibility TEXT,
ADD COLUMN IF NOT EXISTS pets TEXT,
ADD COLUMN IF NOT EXISTS key_safe_location TEXT,
ADD COLUMN IF NOT EXISTS parking_availability TEXT,
ADD COLUMN IF NOT EXISTS emergency_access TEXT;

-- My Accessibility and Communication Fields
ALTER TABLE public.client_personal_info
ADD COLUMN IF NOT EXISTS sensory_impairment TEXT,
ADD COLUMN IF NOT EXISTS communication_aids TEXT,
ADD COLUMN IF NOT EXISTS preferred_communication_method TEXT,
ADD COLUMN IF NOT EXISTS hearing_difficulties BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS vision_difficulties BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS speech_difficulties BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cognitive_impairment BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS mobility_aids TEXT;

-- Do's & Don'ts Fields
ALTER TABLE public.client_personal_info
ADD COLUMN IF NOT EXISTS likes_preferences TEXT,
ADD COLUMN IF NOT EXISTS dislikes_restrictions TEXT,
ADD COLUMN IF NOT EXISTS dos TEXT,
ADD COLUMN IF NOT EXISTS donts TEXT;

-- My GP Fields
ALTER TABLE public.client_personal_info
ADD COLUMN IF NOT EXISTS gp_surgery_name TEXT,
ADD COLUMN IF NOT EXISTS gp_surgery_address TEXT,
ADD COLUMN IF NOT EXISTS gp_surgery_phone TEXT,
ADD COLUMN IF NOT EXISTS gp_surgery_ods_code TEXT;

-- Pharmacy Fields
ALTER TABLE public.client_personal_info
ADD COLUMN IF NOT EXISTS pharmacy_name TEXT,
ADD COLUMN IF NOT EXISTS pharmacy_address TEXT,
ADD COLUMN IF NOT EXISTS pharmacy_phone TEXT,
ADD COLUMN IF NOT EXISTS pharmacy_ods_code TEXT;

-- Desired Outcomes Fields
ALTER TABLE public.client_personal_info
ADD COLUMN IF NOT EXISTS personal_goals TEXT,
ADD COLUMN IF NOT EXISTS desired_outcomes TEXT,
ADD COLUMN IF NOT EXISTS success_measures TEXT,
ADD COLUMN IF NOT EXISTS priority_areas TEXT;

-- General Information Fields
ALTER TABLE public.client_personal_info
ADD COLUMN IF NOT EXISTS main_reasons_for_care TEXT,
ADD COLUMN IF NOT EXISTS used_other_care_providers BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fallen_past_six_months BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_assistance_device BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS arrange_assistance_device BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bereavement_past_two_years BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS warnings TEXT[],
ADD COLUMN IF NOT EXISTS instructions TEXT[],
ADD COLUMN IF NOT EXISTS important_occasions JSONB;