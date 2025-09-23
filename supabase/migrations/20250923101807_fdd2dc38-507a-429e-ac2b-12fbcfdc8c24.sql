-- Create client service reports table
CREATE TABLE public.client_service_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  staff_id UUID NOT NULL,
  visit_record_id UUID REFERENCES public.visit_records(id),
  booking_id UUID REFERENCES public.bookings(id),
  branch_id UUID NOT NULL,
  organization_id UUID,
  
  -- Report Content
  service_date DATE NOT NULL,
  service_duration_minutes INTEGER,
  services_provided TEXT[] NOT NULL DEFAULT '{}',
  tasks_completed TEXT[] DEFAULT '{}',
  client_mood TEXT,
  client_engagement TEXT,
  activities_undertaken TEXT,
  medication_administered BOOLEAN DEFAULT false,
  medication_notes TEXT,
  incident_occurred BOOLEAN DEFAULT false,
  incident_details TEXT,
  next_visit_preparations TEXT,
  carer_observations TEXT,
  client_feedback TEXT,
  
  -- Workflow Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'requires_revision')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  review_notes TEXT,
  revision_requested_at TIMESTAMP WITH TIME ZONE,
  
  -- Visibility Control
  visible_to_client BOOLEAN DEFAULT false,
  client_viewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit Trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID NOT NULL,
  last_modified_by UUID
);

-- Enable RLS
ALTER TABLE public.client_service_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Carers can view their own service reports"
ON public.client_service_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.auth_user_id = auth.uid() 
    AND s.id = client_service_reports.staff_id
  )
);

CREATE POLICY "Carers can create service reports"
ON public.client_service_reports
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.auth_user_id = auth.uid() 
    AND s.id = client_service_reports.staff_id
  )
);

CREATE POLICY "Carers can update their own pending reports"
ON public.client_service_reports
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.auth_user_id = auth.uid() 
    AND s.id = client_service_reports.staff_id
  ) AND status = 'pending'
);

CREATE POLICY "Organization members can manage service reports"
ON public.client_service_reports
FOR ALL
USING (
  organization_id = get_user_organization_id(auth.uid())
);

CREATE POLICY "Clients can view their approved service reports"
ON public.client_service_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.auth_user_id = auth.uid()
    AND c.id = client_service_reports.client_id
  ) AND visible_to_client = true AND status = 'approved'
);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_client_service_reports_updated_at
  BEFORE UPDATE ON public.client_service_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger to set organization_id from branch
CREATE OR REPLACE FUNCTION public.set_service_report_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT b.organization_id INTO NEW.organization_id
    FROM public.branches b
    WHERE b.id = NEW.branch_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_service_report_organization_id
  BEFORE INSERT ON public.client_service_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.set_service_report_organization_id();

-- Create notification function for service reports
CREATE OR REPLACE FUNCTION public.create_service_report_notification()
RETURNS TRIGGER AS $$
DECLARE
  staff_name TEXT;
  client_name TEXT;
  admin_record RECORD;
BEGIN
  -- Get staff and client names
  SELECT CONCAT(s.first_name, ' ', s.last_name) INTO staff_name
  FROM public.staff s WHERE s.id = NEW.staff_id;
  
  SELECT CONCAT(c.first_name, ' ', c.last_name) INTO client_name
  FROM public.clients c WHERE c.id = NEW.client_id;
  
  -- Notify admins when report is submitted
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    FOR admin_record IN 
      SELECT ab.admin_id
      FROM public.admin_branches ab
      WHERE ab.branch_id = NEW.branch_id
    LOOP
      PERFORM public.safe_notify(
        admin_record.admin_id,
        NEW.branch_id,
        'service_report',
        'info',
        'high',
        'New Service Report Submitted',
        staff_name || ' submitted a service report for ' || client_name,
        jsonb_build_object(
          'service_report_id', NEW.id,
          'client_id', NEW.client_id,
          'staff_id', NEW.staff_id,
          'service_date', NEW.service_date
        )
      );
    END LOOP;
  END IF;
  
  -- Notify carer when report status changes
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status != 'pending' THEN
    SELECT auth_user_id INTO staff_name FROM public.staff WHERE id = NEW.staff_id;
    
    PERFORM public.safe_notify(
      (SELECT auth_user_id FROM public.staff WHERE id = NEW.staff_id),
      NEW.branch_id,
      'service_report_status',
      'info',
      CASE WHEN NEW.status = 'approved' THEN 'medium' ELSE 'high' END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Service Report Approved'
        WHEN NEW.status = 'rejected' THEN 'Service Report Rejected'
        WHEN NEW.status = 'requires_revision' THEN 'Service Report Needs Revision'
      END,
      'Your service report for ' || client_name || ' has been ' || NEW.status,
      jsonb_build_object(
        'service_report_id', NEW.id,
        'client_id', NEW.client_id,
        'review_notes', NEW.review_notes
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER service_report_notification_trigger
  AFTER INSERT OR UPDATE ON public.client_service_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.create_service_report_notification();