-- Fix demo request notifications to route to system_users instead of tenant admins

-- Drop the existing trigger with correct name
DROP TRIGGER IF EXISTS demo_request_notification_trigger ON public.demo_requests;

-- Create or replace the function to create notifications for system_users
CREATE OR REPLACE FUNCTION public.create_demo_request_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notifications for all system_users with super_admin role
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
    su.auth_user_id,
    'demo_request',
    'info',
    'high',
    'New Demo Request',
    'Demo request from ' || NEW.full_name || ' (' || COALESCE(NEW.organization_name, 'No organization') || ')',
    jsonb_build_object(
      'demo_request_id', NEW.id,
      'organization_name', NEW.organization_name,
      'contact_name', NEW.full_name,
      'contact_email', NEW.email,
      'phone', NEW.phone,
      'requested_at', NEW.created_at
    )
  FROM public.system_users su
  JOIN public.system_user_roles sur ON su.id = sur.system_user_id
  WHERE sur.role = 'super_admin'
  AND su.auth_user_id IS NOT NULL
  AND su.is_active = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER demo_request_notification_trigger
  AFTER INSERT ON public.demo_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.create_demo_request_notification();

-- Optional: Clean up old demo_request notifications that were sent to tenant users
-- This removes notifications that were incorrectly routed to non-system users
DELETE FROM public.notifications 
WHERE type = 'demo_request' 
AND user_id NOT IN (
  SELECT auth_user_id 
  FROM public.system_users 
  WHERE auth_user_id IS NOT NULL
);