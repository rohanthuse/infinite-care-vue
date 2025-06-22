
-- Create news2_patients table that extends existing clients with NEWS2-specific data
CREATE TABLE public.news2_patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  assigned_carer_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  risk_category TEXT NOT NULL DEFAULT 'low' CHECK (risk_category IN ('low', 'medium', 'high')),
  monitoring_frequency TEXT NOT NULL DEFAULT 'daily' CHECK (monitoring_frequency IN ('hourly', 'every_4_hours', 'every_6_hours', 'daily', 'weekly')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, branch_id)
);

-- Create news2_observations table to store vital signs and calculated scores
CREATE TABLE public.news2_observations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  news2_patient_id UUID NOT NULL REFERENCES public.news2_patients(id) ON DELETE CASCADE,
  recorded_by_staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE RESTRICT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Vital signs
  respiratory_rate INTEGER CHECK (respiratory_rate >= 0 AND respiratory_rate <= 60),
  oxygen_saturation INTEGER CHECK (oxygen_saturation >= 0 AND oxygen_saturation <= 100),
  supplemental_oxygen BOOLEAN NOT NULL DEFAULT false,
  systolic_bp INTEGER CHECK (systolic_bp >= 0 AND systolic_bp <= 300),
  pulse_rate INTEGER CHECK (pulse_rate >= 0 AND pulse_rate <= 300),
  consciousness_level TEXT NOT NULL DEFAULT 'A' CHECK (consciousness_level IN ('A', 'V', 'P', 'U')),
  temperature DECIMAL(4,1) CHECK (temperature >= 30.0 AND temperature <= 45.0),
  
  -- Calculated scores for each parameter
  respiratory_rate_score INTEGER NOT NULL DEFAULT 0 CHECK (respiratory_rate_score >= 0 AND respiratory_rate_score <= 3),
  oxygen_saturation_score INTEGER NOT NULL DEFAULT 0 CHECK (oxygen_saturation_score >= 0 AND oxygen_saturation_score <= 3),
  supplemental_oxygen_score INTEGER NOT NULL DEFAULT 0 CHECK (supplemental_oxygen_score >= 0 AND supplemental_oxygen_score <= 2),
  systolic_bp_score INTEGER NOT NULL DEFAULT 0 CHECK (systolic_bp_score >= 0 AND systolic_bp_score <= 3),
  pulse_rate_score INTEGER NOT NULL DEFAULT 0 CHECK (pulse_rate_score >= 0 AND pulse_rate_score <= 3),
  consciousness_level_score INTEGER NOT NULL DEFAULT 0 CHECK (consciousness_level_score >= 0 AND consciousness_level_score <= 3),
  temperature_score INTEGER NOT NULL DEFAULT 0 CHECK (temperature_score >= 0 AND temperature_score <= 3),
  
  -- Total NEWS2 score and risk assessment
  total_score INTEGER NOT NULL DEFAULT 0 CHECK (total_score >= 0 AND total_score <= 20),
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  
  -- Clinical notes and follow-up
  clinical_notes TEXT,
  action_taken TEXT,
  next_review_time TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create news2_alerts table for automated alerting
CREATE TABLE public.news2_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  news2_observation_id UUID NOT NULL REFERENCES public.news2_observations(id) ON DELETE CASCADE,
  news2_patient_id UUID NOT NULL REFERENCES public.news2_patients(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('high_score', 'deteriorating', 'overdue_observation')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.news2_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news2_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news2_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for news2_patients - branch-based access
CREATE POLICY "Branch staff can view news2 patients" ON public.news2_patients
  FOR SELECT USING (
    branch_id IN (
      SELECT branch_id FROM public.staff WHERE id = auth.uid()
      UNION
      SELECT branch_id FROM public.admin_branches WHERE admin_id = auth.uid()
    )
  );

CREATE POLICY "Branch staff can insert news2 patients" ON public.news2_patients
  FOR INSERT WITH CHECK (
    branch_id IN (
      SELECT branch_id FROM public.staff WHERE id = auth.uid()
      UNION
      SELECT branch_id FROM public.admin_branches WHERE admin_id = auth.uid()
    )
  );

CREATE POLICY "Branch staff can update news2 patients" ON public.news2_patients
  FOR UPDATE USING (
    branch_id IN (
      SELECT branch_id FROM public.staff WHERE id = auth.uid()
      UNION
      SELECT branch_id FROM public.admin_branches WHERE admin_id = auth.uid()
    )
  );

-- RLS policies for news2_observations - branch-based access through patient relationship
CREATE POLICY "Branch staff can view news2 observations" ON public.news2_observations
  FOR SELECT USING (
    news2_patient_id IN (
      SELECT id FROM public.news2_patients WHERE branch_id IN (
        SELECT branch_id FROM public.staff WHERE id = auth.uid()
        UNION
        SELECT branch_id FROM public.admin_branches WHERE admin_id = auth.uid()
      )
    )
  );

CREATE POLICY "Branch staff can insert news2 observations" ON public.news2_observations
  FOR INSERT WITH CHECK (
    news2_patient_id IN (
      SELECT id FROM public.news2_patients WHERE branch_id IN (
        SELECT branch_id FROM public.staff WHERE id = auth.uid()
        UNION
        SELECT branch_id FROM public.admin_branches WHERE admin_id = auth.uid()
      )
    )
  );

-- RLS policies for news2_alerts - branch-based access
CREATE POLICY "Branch staff can view news2 alerts" ON public.news2_alerts
  FOR SELECT USING (
    news2_patient_id IN (
      SELECT id FROM public.news2_patients WHERE branch_id IN (
        SELECT branch_id FROM public.staff WHERE id = auth.uid()
        UNION
        SELECT branch_id FROM public.admin_branches WHERE admin_id = auth.uid()
      )
    )
  );

-- Create indexes for performance
CREATE INDEX idx_news2_patients_branch_id ON public.news2_patients(branch_id);
CREATE INDEX idx_news2_patients_client_id ON public.news2_patients(client_id);
CREATE INDEX idx_news2_patients_assigned_carer_id ON public.news2_patients(assigned_carer_id);
CREATE INDEX idx_news2_observations_patient_id ON public.news2_observations(news2_patient_id);
CREATE INDEX idx_news2_observations_recorded_at ON public.news2_observations(recorded_at DESC);
CREATE INDEX idx_news2_observations_total_score ON public.news2_observations(total_score);
CREATE INDEX idx_news2_alerts_patient_id ON public.news2_alerts(news2_patient_id);
CREATE INDEX idx_news2_alerts_acknowledged ON public.news2_alerts(acknowledged);

-- Function to calculate NEWS2 score automatically
CREATE OR REPLACE FUNCTION public.calculate_news2_score(
  resp_rate INTEGER,
  o2_sat INTEGER,
  supp_o2 BOOLEAN,
  sys_bp INTEGER,
  pulse INTEGER,
  consciousness TEXT,
  temp DECIMAL
) RETURNS TABLE(
  resp_score INTEGER,
  o2_score INTEGER,
  supp_o2_score INTEGER,
  bp_score INTEGER,
  pulse_score INTEGER,
  consciousness_score INTEGER,
  temp_score INTEGER,
  total INTEGER,
  risk TEXT
) LANGUAGE plpgsql AS $$
DECLARE
  resp_score_val INTEGER := 0;
  o2_score_val INTEGER := 0;
  supp_o2_score_val INTEGER := 0;
  bp_score_val INTEGER := 0;
  pulse_score_val INTEGER := 0;
  consciousness_score_val INTEGER := 0;
  temp_score_val INTEGER := 0;
  total_score INTEGER := 0;
  risk_level TEXT := 'low';
BEGIN
  -- Respiratory Rate scoring
  IF resp_rate <= 8 THEN resp_score_val := 3;
  ELSIF resp_rate <= 11 THEN resp_score_val := 1;
  ELSIF resp_rate <= 20 THEN resp_score_val := 0;
  ELSIF resp_rate <= 24 THEN resp_score_val := 2;
  ELSE resp_score_val := 3;
  END IF;
  
  -- Oxygen Saturation scoring
  IF o2_sat <= 91 THEN o2_score_val := 3;
  ELSIF o2_sat <= 93 THEN o2_score_val := 2;
  ELSIF o2_sat <= 95 THEN o2_score_val := 1;
  ELSE o2_score_val := 0;
  END IF;
  
  -- Supplemental Oxygen scoring
  IF supp_o2 THEN supp_o2_score_val := 2;
  ELSE supp_o2_score_val := 0;
  END IF;
  
  -- Blood Pressure scoring
  IF sys_bp <= 90 THEN bp_score_val := 3;
  ELSIF sys_bp <= 100 THEN bp_score_val := 2;
  ELSIF sys_bp <= 110 THEN bp_score_val := 1;
  ELSIF sys_bp <= 219 THEN bp_score_val := 0;
  ELSE bp_score_val := 3;
  END IF;
  
  -- Pulse Rate scoring
  IF pulse <= 40 THEN pulse_score_val := 3;
  ELSIF pulse <= 50 THEN pulse_score_val := 1;
  ELSIF pulse <= 90 THEN pulse_score_val := 0;
  ELSIF pulse <= 110 THEN pulse_score_val := 1;
  ELSIF pulse <= 130 THEN pulse_score_val := 2;
  ELSE pulse_score_val := 3;
  END IF;
  
  -- Consciousness Level scoring
  CASE consciousness
    WHEN 'A' THEN consciousness_score_val := 0;
    WHEN 'V' THEN consciousness_score_val := 3;
    WHEN 'P' THEN consciousness_score_val := 3;
    WHEN 'U' THEN consciousness_score_val := 3;
    ELSE consciousness_score_val := 0;
  END CASE;
  
  -- Temperature scoring
  IF temp <= 35.0 THEN temp_score_val := 3;
  ELSIF temp <= 36.0 THEN temp_score_val := 1;
  ELSIF temp <= 38.0 THEN temp_score_val := 0;
  ELSIF temp <= 39.0 THEN temp_score_val := 1;
  ELSE temp_score_val := 2;
  END IF;
  
  -- Calculate total score
  total_score := resp_score_val + o2_score_val + supp_o2_score_val + bp_score_val + 
                 pulse_score_val + consciousness_score_val + temp_score_val;
  
  -- Determine risk level
  IF total_score >= 7 THEN risk_level := 'high';
  ELSIF total_score >= 5 THEN risk_level := 'medium';
  ELSE risk_level := 'low';
  END IF;
  
  -- Return calculated values
  RETURN QUERY SELECT 
    resp_score_val, o2_score_val, supp_o2_score_val, bp_score_val,
    pulse_score_val, consciousness_score_val, temp_score_val,
    total_score, risk_level;
END;
$$;

-- Trigger to automatically calculate scores on insert/update
CREATE OR REPLACE FUNCTION public.auto_calculate_news2_scores()
RETURNS TRIGGER AS $$
DECLARE
  score_result RECORD;
BEGIN
  -- Calculate scores using the function
  SELECT * INTO score_result FROM public.calculate_news2_score(
    NEW.respiratory_rate,
    NEW.oxygen_saturation,
    NEW.supplemental_oxygen,
    NEW.systolic_bp,
    NEW.pulse_rate,
    NEW.consciousness_level,
    NEW.temperature
  );
  
  -- Update the NEW record with calculated scores
  NEW.respiratory_rate_score := score_result.resp_score;
  NEW.oxygen_saturation_score := score_result.o2_score;
  NEW.supplemental_oxygen_score := score_result.supp_o2_score;
  NEW.systolic_bp_score := score_result.bp_score;
  NEW.pulse_rate_score := score_result.pulse_score;
  NEW.consciousness_level_score := score_result.consciousness_score;
  NEW.temperature_score := score_result.temp_score;
  NEW.total_score := score_result.total;
  NEW.risk_level := score_result.risk;
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_calculate_news2_scores
  BEFORE INSERT OR UPDATE ON public.news2_observations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_calculate_news2_scores();

-- Function to create alerts for high-risk scores
CREATE OR REPLACE FUNCTION public.create_news2_alert()
RETURNS TRIGGER AS $$
BEGIN
  -- Create alert for high risk scores (7+)
  IF NEW.total_score >= 7 THEN
    INSERT INTO public.news2_alerts (
      news2_observation_id,
      news2_patient_id,
      alert_type,
      severity,
      message
    ) VALUES (
      NEW.id,
      NEW.news2_patient_id,
      'high_score',
      'high',
      'HIGH RISK: NEWS2 score of ' || NEW.total_score || ' requires urgent clinical response'
    );
  -- Create alert for medium risk scores (5-6)
  ELSIF NEW.total_score >= 5 THEN
    INSERT INTO public.news2_alerts (
      news2_observation_id,
      news2_patient_id,
      alert_type,
      severity,
      message
    ) VALUES (
      NEW.id,
      NEW.news2_patient_id,
      'high_score',
      'medium',
      'MEDIUM RISK: NEWS2 score of ' || NEW.total_score || ' requires increased monitoring'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_news2_alert
  AFTER INSERT ON public.news2_observations
  FOR EACH ROW
  EXECUTE FUNCTION public.create_news2_alert();

-- Enable realtime for NEWS2 tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.news2_patients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.news2_observations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.news2_alerts;

-- Set replica identity for realtime updates
ALTER TABLE public.news2_patients REPLICA IDENTITY FULL;
ALTER TABLE public.news2_observations REPLICA IDENTITY FULL;
ALTER TABLE public.news2_alerts REPLICA IDENTITY FULL;
