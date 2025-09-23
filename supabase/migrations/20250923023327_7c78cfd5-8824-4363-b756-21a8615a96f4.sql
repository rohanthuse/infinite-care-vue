-- Add age_group enum and column to clients table
CREATE TYPE public.age_group AS ENUM ('child', 'young_person', 'adult');

-- Add age_group column to clients table (defaults to 'adult' for existing clients)
ALTER TABLE public.clients 
ADD COLUMN age_group age_group NOT NULL DEFAULT 'adult'::age_group;

-- Create client_child_info table for children-specific information
CREATE TABLE public.client_child_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
  legal_status TEXT CHECK (legal_status IN ('care_order', 'voluntary', 'other')),
  legal_status_other TEXT,
  social_worker_name TEXT,
  social_worker_contact TEXT,
  social_worker_email TEXT,
  primary_communication TEXT CHECK (primary_communication IN ('verbal', 'pecs', 'makaton', 'aac', 'other')),
  primary_communication_other TEXT,
  key_words_phrases TEXT,
  preferred_communication_approach TEXT,
  communication_triggers TEXT,
  calming_techniques TEXT,
  toileting_needs TEXT,
  dressing_support TEXT,
  eating_drinking_support TEXT CHECK (eating_drinking_support IN ('independent', 'prompted', 'assisted', 'peg')),
  hygiene_routines TEXT,
  independence_level TEXT CHECK (independence_level IN ('independent', 'with_prompts', 'needs_full_support')),
  education_placement TEXT,
  ehcp_targets_linked BOOLEAN DEFAULT false,
  daily_learning_goals TEXT,
  independence_skills TEXT,
  social_skills_development TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client_behavior_support table for behavior management
CREATE TABLE public.client_behavior_support (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  challenging_behaviors TEXT,
  behavior_triggers TEXT,
  early_warning_signs TEXT,
  preventative_strategies TEXT,
  crisis_management_plan TEXT,
  post_incident_protocol TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create client_safeguarding table for safeguarding and risk management
CREATE TABLE public.client_safeguarding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  absconding_risk TEXT CHECK (absconding_risk IN ('low', 'medium', 'high')) DEFAULT 'low',
  absconding_plan TEXT,
  self_harm_risk TEXT CHECK (self_harm_risk IN ('low', 'medium', 'high')) DEFAULT 'low',
  self_harm_plan TEXT,
  violence_aggression_risk TEXT CHECK (violence_aggression_risk IN ('low', 'medium', 'high')) DEFAULT 'low',
  violence_plan TEXT,
  environmental_risks TEXT,
  safeguarding_notes TEXT,
  safeguarding_restrictions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create client_hobbies junction table for hobby-based matching
CREATE TABLE public.client_hobbies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  hobby_id UUID NOT NULL REFERENCES public.hobbies(id) ON DELETE CASCADE,
  interest_level TEXT CHECK (interest_level IN ('low', 'medium', 'high')) DEFAULT 'medium',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, hobby_id)
);

-- Create staff_hobbies junction table for carer hobby matching
CREATE TABLE public.staff_hobbies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  hobby_id UUID NOT NULL REFERENCES public.hobbies(id) ON DELETE CASCADE,
  proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'intermediate',
  enjoys_teaching BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(staff_id, hobby_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.client_child_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_behavior_support ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_safeguarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_hobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_hobbies ENABLE ROW LEVEL SECURITY;

-- RLS policies for client_child_info
CREATE POLICY "Organization members can manage client child info"
ON public.client_child_info
FOR ALL
TO authenticated
USING (
  client_id IN (
    SELECT c.id FROM clients c
    JOIN branches b ON c.branch_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  )
)
WITH CHECK (
  client_id IN (
    SELECT c.id FROM clients c
    JOIN branches b ON c.branch_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  )
);

-- RLS policies for client_behavior_support
CREATE POLICY "Organization members can manage behavior support"
ON public.client_behavior_support
FOR ALL
TO authenticated
USING (
  client_id IN (
    SELECT c.id FROM clients c
    JOIN branches b ON c.branch_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  )
)
WITH CHECK (
  client_id IN (
    SELECT c.id FROM clients c
    JOIN branches b ON c.branch_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  )
);

-- RLS policies for client_safeguarding
CREATE POLICY "Organization members can manage safeguarding"
ON public.client_safeguarding
FOR ALL
TO authenticated
USING (
  client_id IN (
    SELECT c.id FROM clients c
    JOIN branches b ON c.branch_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  )
)
WITH CHECK (
  client_id IN (
    SELECT c.id FROM clients c
    JOIN branches b ON c.branch_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  )
);

-- RLS policies for client_hobbies
CREATE POLICY "Organization members can manage client hobbies"
ON public.client_hobbies
FOR ALL
TO authenticated
USING (
  client_id IN (
    SELECT c.id FROM clients c
    JOIN branches b ON c.branch_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  )
)
WITH CHECK (
  client_id IN (
    SELECT c.id FROM clients c
    JOIN branches b ON c.branch_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  )
);

-- RLS policies for staff_hobbies
CREATE POLICY "Organization members can manage staff hobbies"
ON public.staff_hobbies
FOR ALL
TO authenticated
USING (
  staff_id IN (
    SELECT s.id FROM staff s
    JOIN branches b ON s.branch_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  )
)
WITH CHECK (
  staff_id IN (
    SELECT s.id FROM staff s
    JOIN branches b ON s.branch_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  )
);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_client_child_info_updated_at
  BEFORE UPDATE ON public.client_child_info
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_behavior_support_updated_at
  BEFORE UPDATE ON public.client_behavior_support
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_safeguarding_updated_at
  BEFORE UPDATE ON public.client_safeguarding
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();