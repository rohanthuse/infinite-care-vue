-- Create booking_unavailability_requests table
CREATE TABLE public.booking_unavailability_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff(id),
  branch_id UUID NOT NULL REFERENCES public.branches(id),
  organization_id UUID REFERENCES public.organizations(id),
  reason TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_unavailability_booking ON public.booking_unavailability_requests(booking_id);
CREATE INDEX idx_unavailability_staff ON public.booking_unavailability_requests(staff_id);
CREATE INDEX idx_unavailability_status ON public.booking_unavailability_requests(status);
CREATE INDEX idx_unavailability_branch ON public.booking_unavailability_requests(branch_id);

-- Enable RLS
ALTER TABLE public.booking_unavailability_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Carers can view their own unavailability requests"
  ON public.booking_unavailability_requests FOR SELECT
  USING (auth.uid() IN (SELECT auth_user_id FROM public.staff WHERE id = staff_id));

CREATE POLICY "Carers can create unavailability requests for their bookings"
  ON public.booking_unavailability_requests FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT auth_user_id FROM public.staff WHERE id = staff_id));

CREATE POLICY "Admins can view all unavailability requests in their branches"
  ON public.booking_unavailability_requests FOR SELECT
  USING (
    branch_id IN (
      SELECT branch_id FROM public.admin_branches WHERE admin_id = auth.uid()
    ) OR 
    has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Admins can update unavailability requests"
  ON public.booking_unavailability_requests FOR UPDATE
  USING (
    branch_id IN (
      SELECT branch_id FROM public.admin_branches WHERE admin_id = auth.uid()
    ) OR 
    has_role(auth.uid(), 'super_admin')
  );

-- Create notification trigger
CREATE OR REPLACE FUNCTION public.notify_admin_unavailability_request()
RETURNS TRIGGER AS $$
DECLARE
  staff_name TEXT;
  client_name TEXT;
  booking_time TEXT;
  admin_record RECORD;
BEGIN
  -- Get staff and client details
  SELECT CONCAT(s.first_name, ' ', s.last_name) INTO staff_name
  FROM public.staff s WHERE s.id = NEW.staff_id;
  
  SELECT 
    CONCAT(c.first_name, ' ', c.last_name),
    TO_CHAR(b.start_time, 'YYYY-MM-DD HH24:MI')
  INTO client_name, booking_time
  FROM public.bookings b
  JOIN public.clients c ON b.client_id = c.id
  WHERE b.id = NEW.booking_id;
  
  -- Notify all branch admins
  FOR admin_record IN 
    SELECT ab.admin_id
    FROM public.admin_branches ab
    WHERE ab.branch_id = NEW.branch_id
  LOOP
    INSERT INTO public.notifications (
      user_id,
      branch_id,
      type,
      category,
      priority,
      title,
      message,
      data
    ) VALUES (
      admin_record.admin_id,
      NEW.branch_id,
      'booking_unavailability',
      'warning',
      'urgent',
      'Carer Not Available: Action Required',
      staff_name || ' is not available for appointment with ' || client_name || ' on ' || booking_time,
      jsonb_build_object(
        'unavailability_request_id', NEW.id,
        'booking_id', NEW.booking_id,
        'staff_id', NEW.staff_id,
        'staff_name', staff_name,
        'client_name', client_name,
        'booking_time', booking_time,
        'reason', NEW.reason,
        'notes', NEW.notes
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_admin_unavailability
  AFTER INSERT ON public.booking_unavailability_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_unavailability_request();