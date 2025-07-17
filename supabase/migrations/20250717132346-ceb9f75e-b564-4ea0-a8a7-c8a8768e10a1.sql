-- Create leave management tables

-- Staff leave requests table
CREATE TABLE public.staff_leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL DEFAULT 'annual',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.staff(id),
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_leave_type CHECK (leave_type IN ('annual', 'sick', 'personal', 'maternity', 'paternity', 'emergency')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'))
);

-- Annual leave calendar for admin-blocked dates
CREATE TABLE public.annual_leave_calendar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  leave_date DATE NOT NULL,
  leave_name TEXT NOT NULL,
  is_company_wide BOOLEAN NOT NULL DEFAULT false,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES public.staff(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(branch_id, leave_date, leave_name)
);

-- Enable RLS on both tables
ALTER TABLE public.staff_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_leave_calendar ENABLE ROW LEVEL SECURITY;

-- RLS policies for staff_leave_requests
CREATE POLICY "Staff can view their own leave requests"
ON public.staff_leave_requests
FOR SELECT
USING (
  staff_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.admin_branches ab 
    WHERE ab.branch_id = staff_leave_requests.branch_id 
    AND ab.admin_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'super_admin'
  )
);

CREATE POLICY "Staff can create their own leave requests"
ON public.staff_leave_requests
FOR INSERT
WITH CHECK (
  staff_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.staff s 
    WHERE s.id = auth.uid() 
    AND s.branch_id = staff_leave_requests.branch_id
  )
);

CREATE POLICY "Staff can update their pending leave requests"
ON public.staff_leave_requests
FOR UPDATE
USING (
  (staff_id = auth.uid() AND status = 'pending') OR
  EXISTS (
    SELECT 1 FROM public.admin_branches ab 
    WHERE ab.branch_id = staff_leave_requests.branch_id 
    AND ab.admin_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'super_admin'
  )
);

-- RLS policies for annual_leave_calendar
CREATE POLICY "Users can view leave calendar for their branch"
ON public.annual_leave_calendar
FOR SELECT
USING (
  branch_id IS NULL OR
  EXISTS (
    SELECT 1 FROM public.admin_branches ab 
    WHERE ab.branch_id = annual_leave_calendar.branch_id 
    AND ab.admin_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.staff s 
    WHERE s.branch_id = annual_leave_calendar.branch_id 
    AND s.id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'super_admin'
  )
);

CREATE POLICY "Admins can manage leave calendar"
ON public.annual_leave_calendar
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_branches ab 
    WHERE ab.branch_id = annual_leave_calendar.branch_id 
    AND ab.admin_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_branches ab 
    WHERE ab.branch_id = annual_leave_calendar.branch_id 
    AND ab.admin_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'super_admin'
  )
);

-- Create indexes for better performance
CREATE INDEX idx_staff_leave_requests_staff_id ON public.staff_leave_requests(staff_id);
CREATE INDEX idx_staff_leave_requests_branch_id ON public.staff_leave_requests(branch_id);
CREATE INDEX idx_staff_leave_requests_dates ON public.staff_leave_requests(start_date, end_date);
CREATE INDEX idx_staff_leave_requests_status ON public.staff_leave_requests(status);

CREATE INDEX idx_annual_leave_calendar_branch_id ON public.annual_leave_calendar(branch_id);
CREATE INDEX idx_annual_leave_calendar_date ON public.annual_leave_calendar(leave_date);

-- Function to calculate total days excluding weekends
CREATE OR REPLACE FUNCTION calculate_leave_days(start_date DATE, end_date DATE)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  total_days INTEGER := 0;
  current_date DATE;
BEGIN
  current_date := start_date;
  
  WHILE current_date <= end_date LOOP
    -- Count only weekdays (Monday = 1, Sunday = 7)
    IF EXTRACT(DOW FROM current_date) NOT IN (0, 6) THEN
      total_days := total_days + 1;
    END IF;
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN total_days;
END;
$$;

-- Trigger to auto-calculate total days
CREATE OR REPLACE FUNCTION auto_calculate_leave_days()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.total_days := calculate_leave_days(NEW.start_date, NEW.end_date);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_calculate_leave_days
  BEFORE INSERT OR UPDATE ON public.staff_leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_leave_days();