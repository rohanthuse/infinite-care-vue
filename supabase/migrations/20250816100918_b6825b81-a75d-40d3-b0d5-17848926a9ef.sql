-- Create demo request notification function
CREATE OR REPLACE FUNCTION public.notify_demo_request()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert notification for system administrators
  INSERT INTO public.notifications (
    user_id,
    type,
    category,
    priority,
    title,
    message,
    data
  )
  SELECT 
    ur.user_id,
    'demo_request',
    'info',
    'high',
    'New Demo Request',
    'Demo request from ' || NEW.full_name || ' (' || NEW.organization_name || ')',
    jsonb_build_object(
      'demo_request_id', NEW.id,
      'organization_name', NEW.organization_name,
      'contact_name', NEW.full_name,
      'contact_email', NEW.email
    )
  FROM public.user_roles ur
  WHERE ur.role IN ('super_admin', 'app_admin');
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER demo_request_notify_trigger
  AFTER INSERT ON public.demo_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_demo_request();