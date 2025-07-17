-- Create function to generate leave request notifications
CREATE OR REPLACE FUNCTION public.create_leave_request_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  staff_record RECORD;
  admin_record RECORD;
BEGIN
  -- Get staff information
  SELECT first_name, last_name, branch_id INTO staff_record
  FROM public.staff
  WHERE id = NEW.staff_id;
  
  -- Create notifications for all admins in the same branch
  FOR admin_record IN 
    SELECT ab.admin_id
    FROM public.admin_branches ab
    WHERE ab.branch_id = staff_record.branch_id
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
      staff_record.branch_id,
      'leave_request',
      'info',
      'high',
      'New Leave Request from ' || staff_record.first_name || ' ' || staff_record.last_name,
      'Leave request for ' || NEW.leave_type || ' from ' || NEW.start_date || ' to ' || NEW.end_date || 
      CASE WHEN NEW.reason IS NOT NULL THEN '. Reason: ' || NEW.reason ELSE '' END,
      jsonb_build_object(
        'leave_request_id', NEW.id,
        'staff_id', NEW.staff_id,
        'staff_name', staff_record.first_name || ' ' || staff_record.last_name,
        'leave_type', NEW.leave_type,
        'start_date', NEW.start_date,
        'end_date', NEW.end_date,
        'total_days', NEW.total_days,
        'reason', NEW.reason
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create notifications for new leave requests
DROP TRIGGER IF EXISTS create_leave_request_notification_trigger ON public.staff_leave_requests;
CREATE TRIGGER create_leave_request_notification_trigger
  AFTER INSERT ON public.staff_leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.create_leave_request_notification();