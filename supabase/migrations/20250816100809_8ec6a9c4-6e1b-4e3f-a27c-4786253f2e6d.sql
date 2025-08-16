-- Create demo request notification trigger
CREATE OR REPLACE FUNCTION public.create_demo_request_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Find system administrators (super_admin or app_admin roles)
  FOR admin_user_id IN 
    SELECT DISTINCT ur.user_id
    FROM public.user_roles ur
    WHERE ur.role IN ('super_admin', 'app_admin')
  LOOP
    -- Create notification for each system administrator
    INSERT INTO public.notifications (
      user_id,
      type,
      category,
      priority,
      title,
      message,
      data
    ) VALUES (
      admin_user_id,
      'demo_request',
      'info',
      'high',
      'New Demo Request',
      'Demo request from ' || NEW.full_name || ' (' || NEW.organization_name || ')',
      jsonb_build_object(
        'demo_request_id', NEW.id,
        'organization_name', NEW.organization_name,
        'contact_name', NEW.full_name,
        'contact_email', NEW.email,
        'phone_number', NEW.phone_number,
        'message', LEFT(NEW.message, 100) || CASE WHEN LENGTH(NEW.message) > 100 THEN '...' ELSE '' END,
        'submitted_at', NEW.created_at
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to automatically send notifications for new demo requests
DROP TRIGGER IF EXISTS demo_request_notification_trigger ON public.demo_requests;
CREATE TRIGGER demo_request_notification_trigger
  AFTER INSERT ON public.demo_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.create_demo_request_notification();