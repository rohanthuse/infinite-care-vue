-- Migration: Convert service report notifications to async using Edge Function
-- This dramatically improves performance by making notification creation non-blocking

-- Drop existing trigger
DROP TRIGGER IF EXISTS service_report_notification_trigger ON public.client_service_reports;

-- Create new async notification function
CREATE OR REPLACE FUNCTION public.create_service_report_notification_async()
RETURNS TRIGGER AS $$
BEGIN
  -- For INSERT: Make async HTTP call to Edge Function (non-blocking)
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    PERFORM net.http_post(
      url := 'https://vcrjntfjsmpoupgairep.supabase.co/functions/v1/create-service-report-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjcmpudGZqc21wb3VwZ2FpcmVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NjcxNDAsImV4cCI6MjA2NTU0MzE0MH0.2AACIZItTsFj2-1LGMy0fRcYKvtXd9FtyrRDnkLGsP0'
      ),
      body := jsonb_build_object(
        'service_report_id', NEW.id::text
      )
    );
    
    -- Return immediately without waiting for response
    RETURN NEW;
  END IF;
  
  -- For UPDATE: Keep synchronous notification to carer (only 1 notification)
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status != 'pending' THEN
    DECLARE
      staff_name TEXT;
      client_name TEXT;
      staff_auth_user_id UUID;
    BEGIN
      -- Get staff auth user ID
      SELECT auth_user_id INTO staff_auth_user_id 
      FROM public.staff 
      WHERE id = NEW.staff_id;
      
      -- Get client name for message
      SELECT CONCAT(c.first_name, ' ', c.last_name) INTO client_name
      FROM public.clients c 
      WHERE c.id = NEW.client_id;
      
      -- Notify carer about status change
      IF staff_auth_user_id IS NOT NULL THEN
        PERFORM public.safe_notify(
          staff_auth_user_id,
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
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new trigger
CREATE TRIGGER service_report_notification_trigger
  AFTER INSERT OR UPDATE ON public.client_service_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.create_service_report_notification_async();

-- Add helpful comment
COMMENT ON FUNCTION public.create_service_report_notification_async() IS 
  'Async notification trigger: INSERT operations use Edge Function (fast), UPDATE operations use direct notification (still fast because only 1 notification)';