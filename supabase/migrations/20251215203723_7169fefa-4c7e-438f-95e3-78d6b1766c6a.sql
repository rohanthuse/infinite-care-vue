-- Create staff_deduction_settings table
CREATE TABLE public.staff_deduction_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id),
  organization_id UUID REFERENCES public.organizations(id),
  
  -- Tax Settings
  tax_code TEXT DEFAULT '1257L',
  tax_rate NUMERIC(5,2) DEFAULT 20.00,
  use_custom_tax_rate BOOLEAN DEFAULT false,
  
  -- National Insurance Settings  
  ni_category TEXT DEFAULT 'A',
  ni_rate NUMERIC(5,2) DEFAULT 12.00,
  use_custom_ni_rate BOOLEAN DEFAULT false,
  
  -- Pension Settings
  pension_opted_in BOOLEAN DEFAULT true,
  pension_percentage NUMERIC(5,2) DEFAULT 3.00,
  employer_pension_percentage NUMERIC(5,2) DEFAULT 5.00,
  pension_provider TEXT,
  
  -- Student Loan Settings
  has_student_loan BOOLEAN DEFAULT false,
  student_loan_plan TEXT,
  
  -- Other Deductions (JSONB array of {name, type, amount})
  other_deductions JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_until DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_deduction_settings ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_staff_deduction_settings_staff ON public.staff_deduction_settings(staff_id);
CREATE INDEX idx_staff_deduction_settings_branch ON public.staff_deduction_settings(branch_id);
CREATE INDEX idx_staff_deduction_settings_active ON public.staff_deduction_settings(staff_id, is_active) WHERE is_active = true;

-- RLS Policies
CREATE POLICY "Users can view staff deduction settings in their branch"
ON public.staff_deduction_settings FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM admin_branches ab
    WHERE ab.branch_id = staff_deduction_settings.branch_id
    AND ab.admin_id = auth.uid()
  )
);

CREATE POLICY "Users can insert staff deduction settings in their branch"
ON public.staff_deduction_settings FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM admin_branches ab
    WHERE ab.branch_id = staff_deduction_settings.branch_id
    AND ab.admin_id = auth.uid()
  )
);

CREATE POLICY "Users can update staff deduction settings in their branch"
ON public.staff_deduction_settings FOR UPDATE
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM admin_branches ab
    WHERE ab.branch_id = staff_deduction_settings.branch_id
    AND ab.admin_id = auth.uid()
  )
);

CREATE POLICY "Users can delete staff deduction settings in their branch"
ON public.staff_deduction_settings FOR DELETE
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM admin_branches ab
    WHERE ab.branch_id = staff_deduction_settings.branch_id
    AND ab.admin_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_staff_deduction_settings_updated_at
BEFORE UPDATE ON public.staff_deduction_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();