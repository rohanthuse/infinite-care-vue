-- Add booking_unavailability to allowed notification types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'info', 
  'booking', 
  'medication', 
  'appointment', 
  'message', 
  'leave_request', 
  'incident', 
  'staff_check_in',
  'agreement_expiry', 
  'care_plan', 
  'care_plan_status',
  'demo_request', 
  'task', 
  'unassigned_booking',
  'service_report',
  'service_report_status',
  'booking_unavailability'
));

COMMENT ON CONSTRAINT notifications_type_check ON public.notifications IS 
  'Allowed notification types including booking_unavailability for carer unavailability requests';