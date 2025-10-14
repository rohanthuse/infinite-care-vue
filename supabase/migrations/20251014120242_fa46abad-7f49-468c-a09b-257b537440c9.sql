-- Create staff_rate_schedules table (mirror of client_rate_schedules)
CREATE TABLE IF NOT EXISTS public.staff_rate_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  service_type_code TEXT REFERENCES public.service_types(code),
  authority_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  days_covered TEXT[] NOT NULL DEFAULT '{}',
  time_from TIME NOT NULL,
  time_until TIME NOT NULL,
  rate_category TEXT DEFAULT 'standard',
  pay_based_on TEXT DEFAULT 'service',
  charge_type TEXT DEFAULT 'hourly_rate',
  base_rate NUMERIC NOT NULL,
  rate_15_minutes NUMERIC,
  rate_30_minutes NUMERIC,
  rate_45_minutes NUMERIC,
  rate_60_minutes NUMERIC,
  consecutive_hours_rate NUMERIC,
  bank_holiday_multiplier NUMERIC DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  branch_id UUID REFERENCES public.branches(id),
  organization_id UUID REFERENCES public.organizations(id),
  is_vatable BOOLEAN NOT NULL DEFAULT false
);

-- Create indexes for performance
CREATE INDEX idx_staff_rate_schedules_staff_id ON public.staff_rate_schedules(staff_id);
CREATE INDEX idx_staff_rate_schedules_branch_id ON public.staff_rate_schedules(branch_id);
CREATE INDEX idx_staff_rate_schedules_organization_id ON public.staff_rate_schedules(organization_id);
CREATE INDEX idx_staff_rate_schedules_active ON public.staff_rate_schedules(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.staff_rate_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can manage staff rate schedules in their branch
CREATE POLICY "Admins can manage staff rate schedules"
ON public.staff_rate_schedules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_branches ab
    JOIN public.staff s ON s.branch_id = ab.branch_id
    WHERE ab.admin_id = auth.uid()
    AND s.id = staff_rate_schedules.staff_id
  )
  OR
  has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_branches ab
    JOIN public.staff s ON s.branch_id = ab.branch_id
    WHERE ab.admin_id = auth.uid()
    AND s.id = staff_rate_schedules.staff_id
  )
  OR
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- RLS Policy: Staff can view their own rate schedules (read-only)
CREATE POLICY "Staff can view their own rate schedules"
ON public.staff_rate_schedules
FOR SELECT
USING (
  staff_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.auth_user_id = auth.uid()
    AND s.id = staff_rate_schedules.staff_id
  )
);

COMMENT ON TABLE public.staff_rate_schedules IS 'Rate schedules for staff members with time-based and service-based rates';