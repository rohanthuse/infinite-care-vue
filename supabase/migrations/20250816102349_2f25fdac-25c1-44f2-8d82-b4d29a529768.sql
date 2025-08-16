-- Fix the authentication security issue and create demo request notification trigger
-- First, let's check if we have a trigger for demo_requests
DO $$
BEGIN
  -- Check if trigger exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'demo_request_notification_trigger'
  ) THEN
    -- Create trigger function for demo request notifications
    CREATE OR REPLACE FUNCTION public.create_demo_request_notification()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
    BEGIN
      -- Create notifications for all super_admin and app_admin users
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
    $function$;

    -- Create the trigger
    CREATE TRIGGER demo_request_notification_trigger
      AFTER INSERT ON public.demo_requests
      FOR EACH ROW
      EXECUTE FUNCTION public.create_demo_request_notification();
  END IF;
END
$$;

-- Create notification for the latest demo request that doesn't have notifications yet
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
  WHERE id = 'fbd25f36-1886-4427-8bda-6d3558940f8f'
) dr
WHERE ur.role IN ('super_admin', 'app_admin')
AND NOT EXISTS (
  SELECT 1 FROM public.notifications n
  WHERE n.user_id = ur.user_id 
  AND n.type = 'demo_request'
  AND (n.data->>'demo_request_id')::uuid = dr.id
);