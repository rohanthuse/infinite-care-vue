-- Create enum for essential status
CREATE TYPE essential_status AS ENUM ('pending', 'complete', 'expiring', 'expired', 'not_required');

-- Create table for essential types master data
CREATE TABLE IF NOT EXISTS public.essential_types_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  essential_type text UNIQUE NOT NULL,
  display_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('Background', 'Legal', 'Training', 'Health', 'Insurance')),
  is_mandatory boolean DEFAULT false,
  default_validity_months integer,
  description text,
  sort_order integer DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create table for staff essentials checklist
CREATE TABLE IF NOT EXISTS public.staff_essentials_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  essential_type text NOT NULL,
  category text NOT NULL CHECK (category IN ('Background', 'Legal', 'Training', 'Health', 'Insurance')),
  display_name text NOT NULL,
  status essential_status DEFAULT 'pending',
  required boolean DEFAULT true,
  completion_date date,
  expiry_date date,
  document_id uuid REFERENCES public.staff_documents(id) ON DELETE SET NULL,
  training_record_id uuid REFERENCES public.staff_training_records(id) ON DELETE SET NULL,
  notes text,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at timestamptz,
  reminder_sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(staff_id, essential_type)
);

-- Create indexes for performance
CREATE INDEX idx_staff_essentials_staff_id ON public.staff_essentials_checklist(staff_id);
CREATE INDEX idx_staff_essentials_status ON public.staff_essentials_checklist(status);
CREATE INDEX idx_staff_essentials_expiry ON public.staff_essentials_checklist(expiry_date);
CREATE INDEX idx_staff_essentials_type ON public.staff_essentials_checklist(essential_type);

-- Enable RLS
ALTER TABLE public.essential_types_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_essentials_checklist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for essential_types_master
CREATE POLICY "Everyone can view essential types"
  ON public.essential_types_master FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage essential types"
  ON public.essential_types_master FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'branch_admin'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'branch_admin'::app_role)
  );

-- RLS Policies for staff_essentials_checklist
CREATE POLICY "Staff can view their own essentials"
  ON public.staff_essentials_checklist FOR SELECT
  TO authenticated
  USING (
    staff_id = auth.uid() OR
    staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Admins can view branch staff essentials"
  ON public.staff_essentials_checklist FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM public.staff s
      JOIN public.admin_branches ab ON s.branch_id = ab.branch_id
      WHERE s.id = staff_essentials_checklist.staff_id
      AND ab.admin_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage branch staff essentials"
  ON public.staff_essentials_checklist FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM public.staff s
      JOIN public.admin_branches ab ON s.branch_id = ab.branch_id
      WHERE s.id = staff_essentials_checklist.staff_id
      AND ab.admin_id = auth.uid()
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'super_admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM public.staff s
      JOIN public.admin_branches ab ON s.branch_id = ab.branch_id
      WHERE s.id = staff_essentials_checklist.staff_id
      AND ab.admin_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_essentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_essentials_checklist_updated_at
  BEFORE UPDATE ON public.staff_essentials_checklist
  FOR EACH ROW
  EXECUTE FUNCTION update_essentials_updated_at();

CREATE TRIGGER update_essential_types_updated_at
  BEFORE UPDATE ON public.essential_types_master
  FOR EACH ROW
  EXECUTE FUNCTION update_essentials_updated_at();

-- Function to auto-update status based on expiry date
CREATE OR REPLACE FUNCTION check_essential_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiry_date IS NOT NULL THEN
    IF NEW.expiry_date < CURRENT_DATE THEN
      NEW.status := 'expired';
    ELSIF NEW.expiry_date <= (CURRENT_DATE + INTERVAL '30 days') THEN
      NEW.status := 'expiring';
    ELSIF NEW.status = 'complete' THEN
      NEW.status := 'complete';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_essential_expiry_trigger
  BEFORE INSERT OR UPDATE ON public.staff_essentials_checklist
  FOR EACH ROW
  EXECUTE FUNCTION check_essential_expiry();

-- Insert predefined essential types
INSERT INTO public.essential_types_master (essential_type, display_name, category, is_mandatory, default_validity_months, sort_order) VALUES
  -- Background
  ('dbs_check', 'DBS Check', 'Background', true, 36, 1),
  ('references', 'References', 'Background', true, NULL, 2),
  
  -- Legal
  ('right_to_work', 'Right to Work', 'Legal', true, NULL, 3),
  
  -- Training
  ('first_aid', 'First Aid Certificate', 'Training', true, 36, 4),
  ('fire_safety', 'Fire Safety Training', 'Training', true, 12, 5),
  ('safeguarding', 'Safeguarding Certificate', 'Training', true, 12, 6),
  ('manual_handling', 'Manual Handling', 'Training', true, 12, 7),
  
  -- Health
  ('health_declaration', 'Health Declaration', 'Health', true, 12, 8)
ON CONFLICT (essential_type) DO NOTHING;