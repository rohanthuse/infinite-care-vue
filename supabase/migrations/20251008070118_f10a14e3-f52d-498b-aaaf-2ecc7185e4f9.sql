-- Add 'unassigned_booking' to allowed notification types
-- This fixes the constraint violation when creating unassigned bookings
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
      'rota',
      'unassigned_booking'
    )
  );