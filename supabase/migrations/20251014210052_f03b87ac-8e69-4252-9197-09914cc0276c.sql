-- Create staff_employment_history table
CREATE TABLE IF NOT EXISTS public.staff_employment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  position TEXT NOT NULL,
  employer TEXT NOT NULL,
  location TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('current', 'completed')),
  responsibilities TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_employment_history ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_staff_employment_history_staff_id ON public.staff_employment_history(staff_id);
CREATE INDEX idx_staff_employment_history_start_date ON public.staff_employment_history(start_date DESC);

-- RLS Policies: Staff can view and manage their own employment history
CREATE POLICY "Staff can view their own employment history"
ON public.staff_employment_history
FOR SELECT
USING (
  staff_id IN (
    SELECT id FROM public.staff WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Staff can insert their own employment history"
ON public.staff_employment_history
FOR INSERT
WITH CHECK (
  staff_id IN (
    SELECT id FROM public.staff WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Staff can update their own employment history"
ON public.staff_employment_history
FOR UPDATE
USING (
  staff_id IN (
    SELECT id FROM public.staff WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Staff can delete their own employment history"
ON public.staff_employment_history
FOR DELETE
USING (
  staff_id IN (
    SELECT id FROM public.staff WHERE auth_user_id = auth.uid()
  )
);

-- Admins can manage all employment history in their branch
CREATE POLICY "Admins can view all employment history in their branch"
ON public.staff_employment_history
FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.staff s
    JOIN public.admin_branches ab ON s.branch_id = ab.branch_id
    WHERE s.id = staff_employment_history.staff_id
    AND ab.admin_id = auth.uid()
  )
);

CREATE POLICY "Admins can insert employment history for their branch staff"
ON public.staff_employment_history
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.staff s
    JOIN public.admin_branches ab ON s.branch_id = ab.branch_id
    WHERE s.id = staff_employment_history.staff_id
    AND ab.admin_id = auth.uid()
  )
);

CREATE POLICY "Admins can update employment history for their branch staff"
ON public.staff_employment_history
FOR UPDATE
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.staff s
    JOIN public.admin_branches ab ON s.branch_id = ab.branch_id
    WHERE s.id = staff_employment_history.staff_id
    AND ab.admin_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete employment history for their branch staff"
ON public.staff_employment_history
FOR DELETE
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.staff s
    JOIN public.admin_branches ab ON s.branch_id = ab.branch_id
    WHERE s.id = staff_employment_history.staff_id
    AND ab.admin_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_staff_employment_history_updated_at
BEFORE UPDATE ON public.staff_employment_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function for update_updated_at_column if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;