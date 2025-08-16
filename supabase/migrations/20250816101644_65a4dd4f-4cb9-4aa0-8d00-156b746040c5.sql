-- Fix notification type constraint to include demo_request
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add updated constraint that includes demo_request
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('booking', 'message', 'system', 'reminder', 'payment', 'leave_request', 'demo_request'));

-- Now create the notifications for the existing demo request
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