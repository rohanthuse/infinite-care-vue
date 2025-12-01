-- Fix column reference in demo request notification trigger
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
      'phone', NEW.phone_number,
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