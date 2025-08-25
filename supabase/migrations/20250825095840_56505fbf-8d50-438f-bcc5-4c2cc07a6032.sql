
-- Expand allowed notification types to include 'care_plan' and other used types
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (
    type IN (
      'booking',
      'message',
      'system',
      'reminder',
      'payment',
      'leave_request',
      'demo_request',
      'care_plan',
      'document',
      'task',
      'appointment',
      'staff',
      'client',
      'medication',
      'rota'
    )
  );
