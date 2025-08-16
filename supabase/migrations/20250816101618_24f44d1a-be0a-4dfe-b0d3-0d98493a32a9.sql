-- Fix the notification function to use SECURITY DEFINER and handle RLS properly
CREATE OR REPLACE FUNCTION public.notify_demo_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER  -- This allows the function to bypass RLS
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

-- Manually create notification for the existing demo request
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
  'Demo request from ' || dr.full_name || ' (' || dr.organization_name || ')',
  jsonb_build_object(
    'demo_request_id', dr.id,
    'organization_name', dr.organization_name,
    'contact_name', dr.full_name,
    'contact_email', dr.email
  )
FROM public.user_roles ur
CROSS JOIN (
  SELECT * FROM public.demo_requests 
  WHERE id = '686053fb-319f-4b36-9e60-b61454b1e6b3'
) dr
WHERE ur.role IN ('super_admin', 'app_admin');