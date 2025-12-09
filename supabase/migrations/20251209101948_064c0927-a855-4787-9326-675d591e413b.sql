-- Fix the overdue booking notification function to prevent future duplicates
CREATE OR REPLACE FUNCTION create_overdue_booking_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create notifications for bookings that are overdue (past end_time and not completed)
  INSERT INTO public.notifications (user_id, branch_id, organization_id, type, category, priority, title, message, data)
  SELECT 
    s.auth_user_id as user_id,
    b.branch_id,
    br.organization_id,
    'booking' as type,
    'warning' as category,
    'high' as priority,
    'Overdue Booking' as title,
    CONCAT('Booking with ', c.first_name, ' ', c.last_name, ' is overdue') as message,
    jsonb_build_object('booking_id', b.id::text, 'client_name', CONCAT(c.first_name, ' ', c.last_name), 'notification_type', 'booking_overdue') as data
  FROM public.bookings b
  LEFT JOIN public.clients c ON b.client_id = c.id
  LEFT JOIN public.staff s ON b.staff_id = s.id
  LEFT JOIN public.branches br ON b.branch_id = br.id
  WHERE b.end_time < now()
    AND b.status NOT IN ('completed', 'cancelled', 'done')
    AND s.auth_user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n 
      WHERE n.user_id = s.auth_user_id
        AND n.type = 'booking'
        AND n.title = 'Overdue Booking'
        AND n.data->>'booking_id' = b.id::text
        AND n.created_at > now() - interval '24 hours'
    );
END;
$$;

-- Delete ALL "Overdue Booking" notifications (simpler, faster approach)
-- They will be regenerated correctly by the fixed function
DELETE FROM notifications WHERE title = 'Overdue Booking';