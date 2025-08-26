-- Update create_overdue_booking_notifications function to use auth_user_id
CREATE OR REPLACE FUNCTION public.create_overdue_booking_notifications()
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Create notifications for bookings that are overdue (past end_time and not completed)
  INSERT INTO public.notifications (user_id, branch_id, type, category, priority, title, message, data)
  SELECT 
    s.auth_user_id as user_id,  -- Use auth_user_id instead of staff id
    b.branch_id,
    'booking' as type,
    'warning' as category,
    'high' as priority,
    'Overdue Booking' as title,
    CONCAT('Booking with ', c.first_name, ' ', c.last_name, ' is overdue') as message,
    json_build_object('booking_id', b.id, 'client_name', CONCAT(c.first_name, ' ', c.last_name))::jsonb as data
  FROM public.bookings b
  LEFT JOIN public.clients c ON b.client_id = c.id
  LEFT JOIN public.staff s ON b.staff_id = s.id
  WHERE b.end_time < now()
    AND b.status != 'completed'
    AND s.auth_user_id IS NOT NULL  -- Only create notifications for staff with auth accounts
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n 
      WHERE n.user_id = s.auth_user_id
        AND n.type = 'booking'
        AND (n.data->>'booking_id')::uuid = b.id
        AND n.created_at > now() - interval '24 hours'
    );
END;
$function$;