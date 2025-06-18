
-- Phase 1: Database Schema Extensions
-- Create comprehensive patient data tables

-- Client Personal Information (extended demographics)
CREATE TABLE public.client_personal_info (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  preferred_communication text DEFAULT 'phone',
  cultural_preferences text,
  language_preferences text,
  religion text,
  marital_status text,
  next_of_kin_name text,
  next_of_kin_phone text,
  next_of_kin_relationship text,
  gp_name text,
  gp_practice text,
  gp_phone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(client_id)
);

-- Client Medical Information (comprehensive health data)
CREATE TABLE public.client_medical_info (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  allergies text[],
  current_medications text[],
  medical_conditions text[],
  medical_history text,
  mobility_status text,
  cognitive_status text,
  communication_needs text,
  sensory_impairments text[],
  mental_health_status text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(client_id)
);

-- Client Assessments (various assessment types)
CREATE TABLE public.client_assessments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  assessment_type text NOT NULL,
  assessment_name text NOT NULL,
  assessment_date date NOT NULL,
  performed_by text NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  results text,
  score integer,
  recommendations text,
  next_review_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Client Equipment (assistive devices and medical equipment)
CREATE TABLE public.client_equipment (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  equipment_name text NOT NULL,
  equipment_type text NOT NULL,
  manufacturer text,
  model_number text,
  serial_number text,
  installation_date date,
  maintenance_schedule text,
  last_maintenance_date date,
  next_maintenance_date date,
  status text NOT NULL DEFAULT 'active',
  location text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Client Dietary Requirements (comprehensive nutrition info)
CREATE TABLE public.client_dietary_requirements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  dietary_restrictions text[],
  food_allergies text[],
  food_preferences text[],
  meal_schedule jsonb,
  nutritional_needs text,
  supplements text[],
  feeding_assistance_required boolean DEFAULT false,
  special_equipment_needed text,
  texture_modifications text,
  fluid_restrictions text,
  weight_monitoring boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(client_id)
);

-- Client Personal Care (care routines and preferences)
CREATE TABLE public.client_personal_care (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  personal_hygiene_needs text,
  bathing_preferences text,
  dressing_assistance_level text,
  toileting_assistance_level text,
  continence_status text,
  sleep_patterns text,
  behavioral_notes text,
  comfort_measures text,
  pain_management text,
  skin_care_needs text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(client_id)
);

-- Client Service Actions (enhanced service tracking)
CREATE TABLE public.client_service_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  care_plan_id uuid REFERENCES public.client_care_plans(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  service_category text NOT NULL,
  provider_name text NOT NULL,
  frequency text NOT NULL,
  duration text NOT NULL,
  schedule_details text,
  goals text[],
  progress_status text NOT NULL DEFAULT 'active',
  start_date date NOT NULL,
  end_date date,
  last_completed_date date,
  next_scheduled_date date,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Client Risk Assessments (specific risk evaluation)
CREATE TABLE public.client_risk_assessments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  risk_type text NOT NULL,
  risk_level text NOT NULL,
  risk_factors text[],
  mitigation_strategies text[],
  assessment_date date NOT NULL,
  assessed_by text NOT NULL,
  review_date date,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Extend clients table with additional fields
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS emergency_contact text,
ADD COLUMN IF NOT EXISTS emergency_phone text,
ADD COLUMN IF NOT EXISTS gp_details text,
ADD COLUMN IF NOT EXISTS mobility_status text,
ADD COLUMN IF NOT EXISTS communication_preferences text;

-- Add indexes for better performance
CREATE INDEX idx_client_personal_info_client_id ON public.client_personal_info(client_id);
CREATE INDEX idx_client_medical_info_client_id ON public.client_medical_info(client_id);
CREATE INDEX idx_client_assessments_client_id ON public.client_assessments(client_id);
CREATE INDEX idx_client_equipment_client_id ON public.client_equipment(client_id);
CREATE INDEX idx_client_dietary_requirements_client_id ON public.client_dietary_requirements(client_id);
CREATE INDEX idx_client_personal_care_client_id ON public.client_personal_care(client_id);
CREATE INDEX idx_client_service_actions_client_id ON public.client_service_actions(client_id);
CREATE INDEX idx_client_risk_assessments_client_id ON public.client_risk_assessments(client_id);

-- Enable RLS on all new tables
ALTER TABLE public.client_personal_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_medical_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_dietary_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_personal_care ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_service_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_risk_assessments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users (basic read access)
CREATE POLICY "Allow authenticated users to read client personal info" ON public.client_personal_info
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to read client medical info" ON public.client_medical_info
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to read client assessments" ON public.client_assessments
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to read client equipment" ON public.client_equipment
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to read client dietary requirements" ON public.client_dietary_requirements
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to read client personal care" ON public.client_personal_care
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to read client service actions" ON public.client_service_actions
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to read client risk assessments" ON public.client_risk_assessments
  FOR SELECT USING (true);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_client_personal_info_updated_at BEFORE UPDATE ON public.client_personal_info FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_client_medical_info_updated_at BEFORE UPDATE ON public.client_medical_info FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_client_assessments_updated_at BEFORE UPDATE ON public.client_assessments FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_client_equipment_updated_at BEFORE UPDATE ON public.client_equipment FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_client_dietary_requirements_updated_at BEFORE UPDATE ON public.client_dietary_requirements FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_client_personal_care_updated_at BEFORE UPDATE ON public.client_personal_care FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_client_service_actions_updated_at BEFORE UPDATE ON public.client_service_actions FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_client_risk_assessments_updated_at BEFORE UPDATE ON public.client_risk_assessments FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
