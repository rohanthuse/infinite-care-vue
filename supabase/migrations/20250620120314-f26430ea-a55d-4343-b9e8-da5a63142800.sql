
-- Create training_courses table for available training programs
CREATE TABLE public.training_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('core', 'mandatory', 'specialized', 'optional')),
  valid_for_months INTEGER,
  required_score INTEGER DEFAULT 70 CHECK (required_score >= 0 AND required_score <= 100),
  max_score INTEGER DEFAULT 100 CHECK (max_score >= 0 AND max_score <= 100),
  branch_id UUID REFERENCES public.branches(id),
  is_mandatory BOOLEAN DEFAULT false,
  certificate_template TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived'))
);

-- Create staff_training_records table to track individual completion records
CREATE TABLE public.staff_training_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES public.staff(id) NOT NULL,
  training_course_id UUID REFERENCES public.training_courses(id) NOT NULL,
  branch_id UUID REFERENCES public.branches(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'not-started' CHECK (status IN ('not-started', 'in-progress', 'completed', 'expired')),
  completion_date DATE,
  expiry_date DATE,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  certificate_url TEXT,
  notes TEXT,
  assigned_date DATE DEFAULT CURRENT_DATE,
  assigned_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(staff_id, training_course_id)
);

-- Add RLS policies for training_courses
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view training courses in their branches"
  ON public.training_courses FOR SELECT
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    EXISTS (
      SELECT 1 FROM public.admin_branches ab 
      WHERE ab.branch_id = training_courses.branch_id 
      AND ab.admin_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.staff s
      WHERE s.id = auth.uid()
      AND s.branch_id = training_courses.branch_id
    )
  );

CREATE POLICY "Admins can manage training courses"
  ON public.training_courses FOR ALL
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    EXISTS (
      SELECT 1 FROM public.admin_branches ab 
      WHERE ab.branch_id = training_courses.branch_id 
      AND ab.admin_id = auth.uid()
    )
  );

-- Add RLS policies for staff_training_records
ALTER TABLE public.staff_training_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view training records in their branches"
  ON public.staff_training_records FOR SELECT
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    EXISTS (
      SELECT 1 FROM public.admin_branches ab 
      WHERE ab.branch_id = staff_training_records.branch_id 
      AND ab.admin_id = auth.uid()
    ) OR
    staff_id = auth.uid()
  );

CREATE POLICY "Admins and staff can update training records"
  ON public.staff_training_records FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    EXISTS (
      SELECT 1 FROM public.admin_branches ab 
      WHERE ab.branch_id = staff_training_records.branch_id 
      AND ab.admin_id = auth.uid()
    ) OR
    staff_id = auth.uid()
  );

CREATE POLICY "Admins can create training records"
  ON public.staff_training_records FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin') OR
    EXISTS (
      SELECT 1 FROM public.admin_branches ab 
      WHERE ab.branch_id = staff_training_records.branch_id 
      AND ab.admin_id = auth.uid()
    )
  );

-- Create triggers for updating updated_at timestamps
CREATE TRIGGER update_training_courses_updated_at
  BEFORE UPDATE ON public.training_courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_training_records_updated_at
  BEFORE UPDATE ON public.staff_training_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert comprehensive dummy training courses
INSERT INTO public.training_courses (title, description, category, valid_for_months, required_score, max_score, branch_id, is_mandatory) VALUES

-- Core Training Courses
('Manual Handling Techniques', 'Essential training for safe lifting, moving, and positioning of clients to prevent injury', 'core', 12, 80, 100, 
 (SELECT id FROM public.branches LIMIT 1), true),

('Basic Life Support (BLS)', 'Critical life-saving techniques including CPR and emergency response procedures', 'core', 24, 85, 100, 
 (SELECT id FROM public.branches LIMIT 1), true),

('Communication Skills in Healthcare', 'Effective communication techniques with clients, families, and healthcare teams', 'core', 18, 75, 100, 
 (SELECT id FROM public.branches LIMIT 1), true),

('Personal Care Fundamentals', 'Core skills for providing dignified personal care including washing, dressing, and toileting assistance', 'core', 12, 80, 100, 
 (SELECT id FROM public.branches LIMIT 1), true),

-- Mandatory Training Courses
('Infection Prevention and Control', 'Comprehensive training on preventing the spread of infections in healthcare settings', 'mandatory', 12, 90, 100, 
 (SELECT id FROM public.branches LIMIT 1), true),

('Safeguarding Adults', 'Essential training on recognizing, reporting, and preventing abuse of vulnerable adults', 'mandatory', 12, 85, 100, 
 (SELECT id FROM public.branches LIMIT 1), true),

('Health and Safety in the Workplace', 'Workplace safety procedures, risk assessment, and accident prevention', 'mandatory', 12, 80, 100, 
 (SELECT id FROM public.branches LIMIT 1), true),

('Data Protection and Confidentiality', 'GDPR compliance and maintaining client confidentiality in healthcare settings', 'mandatory', 24, 85, 100, 
 (SELECT id FROM public.branches LIMIT 1), true),

('Mental Health Awareness', 'Understanding mental health conditions and appropriate support strategies', 'mandatory', 18, 75, 100, 
 (SELECT id FROM public.branches LIMIT 1), true),

('Medication Awareness', 'Basic understanding of medications, side effects, and safe administration practices', 'mandatory', 12, 85, 100, 
 (SELECT id FROM public.branches LIMIT 1), true),

-- Specialized Training Courses
('Dementia Care Specialist', 'Advanced training in person-centered dementia care approaches and behavioral management', 'specialized', 24, 80, 100, 
 (SELECT id FROM public.branches LIMIT 1), false),

('End of Life Care', 'Compassionate care for clients in their final stages of life, including family support', 'specialized', 36, 75, 100, 
 (SELECT id FROM public.branches LIMIT 1), false),

('Medication Administration', 'Certified training for safe medication administration and record keeping', 'specialized', 12, 90, 100, 
 (SELECT id FROM public.branches LIMIT 1), false),

('Mental Health First Aid', 'Advanced mental health crisis intervention and support techniques', 'specialized', 36, 85, 100, 
 (SELECT id FROM public.branches LIMIT 1), false),

('Physiotherapy Assistant Skills', 'Supporting physiotherapy treatments and mobility exercises', 'specialized', 24, 80, 100, 
 (SELECT id FROM public.branches LIMIT 1), false),

('Autism Spectrum Disorder Support', 'Specialized care techniques for clients with autism spectrum disorders', 'specialized', 18, 75, 100, 
 (SELECT id FROM public.branches LIMIT 1), false),

('Diabetes Management', 'Understanding diabetes care, blood glucose monitoring, and dietary considerations', 'specialized', 12, 85, 100, 
 (SELECT id FROM public.branches LIMIT 1), false),

-- Optional Training Courses
('Food Hygiene and Nutrition', 'Safe food handling practices and basic nutritional awareness', 'optional', 36, 70, 100, 
 (SELECT id FROM public.branches LIMIT 1), false),

('Activity Coordination', 'Planning and leading recreational and therapeutic activities for clients', 'optional', 24, 70, 100, 
 (SELECT id FROM public.branches LIMIT 1), false),

('Digital Healthcare Technology', 'Using digital tools and electronic health records effectively', 'optional', 18, 75, 100, 
 (SELECT id FROM public.branches LIMIT 1), false);

-- Insert comprehensive dummy training records for existing staff
INSERT INTO public.staff_training_records (staff_id, training_course_id, branch_id, status, completion_date, expiry_date, score, assigned_date, notes) 
SELECT 
  s.id as staff_id,
  tc.id as training_course_id,
  s.branch_id,
  CASE 
    WHEN random() < 0.6 THEN 'completed'
    WHEN random() < 0.8 THEN 'in-progress'
    WHEN random() < 0.9 THEN 'not-started'
    ELSE 'expired'
  END as status,
  CASE 
    WHEN random() < 0.6 THEN CURRENT_DATE - (random() * 365)::int
    ELSE NULL
  END as completion_date,
  CASE 
    WHEN random() < 0.6 AND tc.valid_for_months IS NOT NULL THEN 
      (CURRENT_DATE - (random() * 365)::int) + (tc.valid_for_months || ' months')::interval
    ELSE NULL
  END as expiry_date,
  CASE 
    WHEN random() < 0.6 THEN (70 + (random() * 30))::int
    ELSE NULL
  END as score,
  CURRENT_DATE - (random() * 90)::int as assigned_date,
  CASE 
    WHEN random() < 0.3 THEN 'Completed during orientation period'
    WHEN random() < 0.6 THEN 'Requires refresher training'
    ELSE NULL
  END as notes
FROM public.staff s
CROSS JOIN public.training_courses tc
WHERE s.branch_id = tc.branch_id
AND random() < 0.8; -- Not all staff will have all training records

-- Update expiry status based on dates
UPDATE public.staff_training_records 
SET status = 'expired' 
WHERE expiry_date < CURRENT_DATE AND status = 'completed';

-- Enable realtime for training tables
ALTER TABLE public.training_courses REPLICA IDENTITY FULL;
ALTER TABLE public.staff_training_records REPLICA IDENTITY FULL;
