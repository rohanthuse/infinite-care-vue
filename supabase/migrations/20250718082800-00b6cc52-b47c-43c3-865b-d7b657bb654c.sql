-- Create visit_records table for tracking each visit
CREATE TABLE public.visit_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL,
  client_id UUID NOT NULL,
  staff_id UUID NOT NULL,
  branch_id UUID NOT NULL,
  visit_start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  visit_end_time TIMESTAMP WITH TIME ZONE,
  actual_duration_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled', 'interrupted')),
  visit_notes TEXT,
  client_signature_data TEXT,
  staff_signature_data TEXT,
  location_data JSONB, -- GPS coordinates, address verification
  visit_summary TEXT,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create visit_tasks table for tracking task completion during visits
CREATE TABLE public.visit_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_record_id UUID NOT NULL REFERENCES public.visit_records(id) ON DELETE CASCADE,
  task_category TEXT NOT NULL, -- e.g., 'hygiene', 'meals', 'mobility', 'medication'
  task_name TEXT NOT NULL,
  task_description TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_notes TEXT,
  completion_time_minutes INTEGER,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_by UUID, -- staff member who assigned the task
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create visit_medications table for tracking medication administration
CREATE TABLE public.visit_medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_record_id UUID NOT NULL REFERENCES public.visit_records(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  administration_time TIMESTAMP WITH TIME ZONE,
  prescribed_time TIME WITHOUT TIME ZONE, -- scheduled time for medication
  administration_method TEXT, -- oral, injection, topical, etc.
  is_administered BOOLEAN NOT NULL DEFAULT false,
  administration_notes TEXT,
  missed_reason TEXT, -- if medication was missed
  side_effects_observed TEXT,
  administered_by UUID, -- staff member who administered
  witnessed_by UUID, -- witness if required
  medication_id UUID, -- reference to medication catalog if exists
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create visit_events table for recording incidents/events during visits
CREATE TABLE public.visit_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_record_id UUID NOT NULL REFERENCES public.visit_records(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('incident', 'accident', 'near_miss', 'medication_error', 'fall', 'injury', 'behavioral', 'emergency', 'observation', 'achievement')),
  event_category TEXT, -- additional categorization
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  event_title TEXT NOT NULL,
  event_description TEXT NOT NULL,
  event_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  location_in_home TEXT, -- kitchen, bathroom, bedroom, etc.
  immediate_action_taken TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_notes TEXT,
  reported_to TEXT[], -- who was notified (family, manager, emergency services)
  photos_taken BOOLEAN DEFAULT false,
  photo_urls TEXT[],
  body_map_data JSONB, -- if injury involved
  witnesses TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create visit_vitals table for NEWS2 and other vital sign readings
CREATE TABLE public.visit_vitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_record_id UUID NOT NULL REFERENCES public.visit_records(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  reading_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  vital_type TEXT NOT NULL DEFAULT 'news2' CHECK (vital_type IN ('news2', 'blood_pressure', 'temperature', 'weight', 'blood_sugar', 'other')),
  
  -- NEWS2 specific fields
  respiratory_rate INTEGER,
  oxygen_saturation INTEGER,
  supplemental_oxygen BOOLEAN DEFAULT false,
  systolic_bp INTEGER,
  diastolic_bp INTEGER,
  pulse_rate INTEGER,
  consciousness_level TEXT CHECK (consciousness_level IN ('A', 'V', 'P', 'U')), -- AVPU scale
  temperature NUMERIC(4,1),
  news2_total_score INTEGER,
  news2_risk_level TEXT CHECK (news2_risk_level IN ('low', 'medium', 'high')),
  
  -- General vital signs
  weight_kg NUMERIC(5,2),
  blood_sugar_mmol NUMERIC(4,1),
  other_readings JSONB,
  
  notes TEXT,
  taken_by UUID, -- staff member who took the reading
  verified_by UUID, -- if verification required
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_visit_records_booking_id ON public.visit_records(booking_id);
CREATE INDEX idx_visit_records_client_id ON public.visit_records(client_id);
CREATE INDEX idx_visit_records_staff_id ON public.visit_records(staff_id);
CREATE INDEX idx_visit_records_branch_id ON public.visit_records(branch_id);
CREATE INDEX idx_visit_records_status ON public.visit_records(status);
CREATE INDEX idx_visit_records_visit_start_time ON public.visit_records(visit_start_time);

CREATE INDEX idx_visit_tasks_visit_record_id ON public.visit_tasks(visit_record_id);
CREATE INDEX idx_visit_tasks_task_category ON public.visit_tasks(task_category);
CREATE INDEX idx_visit_tasks_is_completed ON public.visit_tasks(is_completed);

CREATE INDEX idx_visit_medications_visit_record_id ON public.visit_medications(visit_record_id);
CREATE INDEX idx_visit_medications_is_administered ON public.visit_medications(is_administered);
CREATE INDEX idx_visit_medications_administration_time ON public.visit_medications(administration_time);

CREATE INDEX idx_visit_events_visit_record_id ON public.visit_events(visit_record_id);
CREATE INDEX idx_visit_events_event_type ON public.visit_events(event_type);
CREATE INDEX idx_visit_events_severity ON public.visit_events(severity);
CREATE INDEX idx_visit_events_event_time ON public.visit_events(event_time);

CREATE INDEX idx_visit_vitals_visit_record_id ON public.visit_vitals(visit_record_id);
CREATE INDEX idx_visit_vitals_client_id ON public.visit_vitals(client_id);
CREATE INDEX idx_visit_vitals_vital_type ON public.visit_vitals(vital_type);
CREATE INDEX idx_visit_vitals_reading_time ON public.visit_vitals(reading_time);

-- Enable Row Level Security
ALTER TABLE public.visit_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_vitals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for visit_records
CREATE POLICY "Branch staff can manage visit records" ON public.visit_records
  FOR ALL
  USING (
    branch_id IN (
      SELECT s.branch_id FROM staff s WHERE s.id = auth.uid()
      UNION
      SELECT ab.branch_id FROM admin_branches ab WHERE ab.admin_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view their own visit records" ON public.visit_records
  FOR SELECT
  USING (
    client_id IN (
      SELECT c.id FROM clients c WHERE c.auth_user_id = auth.uid()
    )
  );

-- Create RLS policies for visit_tasks
CREATE POLICY "Branch staff can manage visit tasks" ON public.visit_tasks
  FOR ALL
  USING (
    visit_record_id IN (
      SELECT vr.id FROM visit_records vr 
      WHERE vr.branch_id IN (
        SELECT s.branch_id FROM staff s WHERE s.id = auth.uid()
        UNION
        SELECT ab.branch_id FROM admin_branches ab WHERE ab.admin_id = auth.uid()
      )
    )
  );

-- Create RLS policies for visit_medications
CREATE POLICY "Branch staff can manage visit medications" ON public.visit_medications
  FOR ALL
  USING (
    visit_record_id IN (
      SELECT vr.id FROM visit_records vr 
      WHERE vr.branch_id IN (
        SELECT s.branch_id FROM staff s WHERE s.id = auth.uid()
        UNION
        SELECT ab.branch_id FROM admin_branches ab WHERE ab.admin_id = auth.uid()
      )
    )
  );

-- Create RLS policies for visit_events
CREATE POLICY "Branch staff can manage visit events" ON public.visit_events
  FOR ALL
  USING (
    visit_record_id IN (
      SELECT vr.id FROM visit_records vr 
      WHERE vr.branch_id IN (
        SELECT s.branch_id FROM staff s WHERE s.id = auth.uid()
        UNION
        SELECT ab.branch_id FROM admin_branches ab WHERE ab.admin_id = auth.uid()
      )
    )
  );

-- Create RLS policies for visit_vitals
CREATE POLICY "Branch staff can manage visit vitals" ON public.visit_vitals
  FOR ALL
  USING (
    visit_record_id IN (
      SELECT vr.id FROM visit_records vr 
      WHERE vr.branch_id IN (
        SELECT s.branch_id FROM staff s WHERE s.id = auth.uid()
        UNION
        SELECT ab.branch_id FROM admin_branches ab WHERE ab.admin_id = auth.uid()
      )
    )
  );

CREATE POLICY "Clients can view their own visit vitals" ON public.visit_vitals
  FOR SELECT
  USING (
    client_id IN (
      SELECT c.id FROM clients c WHERE c.auth_user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_visit_records_updated_at
  BEFORE UPDATE ON public.visit_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_visit_tasks_updated_at
  BEFORE UPDATE ON public.visit_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_visit_medications_updated_at
  BEFORE UPDATE ON public.visit_medications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_visit_events_updated_at
  BEFORE UPDATE ON public.visit_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically create a visit record when a booking starts
CREATE OR REPLACE FUNCTION public.create_visit_record_on_booking_start()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create visit record when status changes to 'in_progress'
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'in_progress' THEN
    INSERT INTO public.visit_records (
      booking_id,
      client_id,
      staff_id,
      branch_id,
      visit_start_time,
      status
    ) VALUES (
      NEW.id,
      NEW.client_id,
      NEW.staff_id,
      NEW.branch_id,
      now(),
      'in_progress'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create visit record when booking starts
CREATE TRIGGER create_visit_record_trigger
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_visit_record_on_booking_start();