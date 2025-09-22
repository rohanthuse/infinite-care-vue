-- Create function to notify about approaching unassigned bookings
CREATE OR REPLACE FUNCTION public.notify_unassigned_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  booking_record RECORD;
  admin_record RECORD;
  hours_until INTEGER;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Find unassigned bookings within the next 48 hours
  FOR booking_record IN 
    SELECT 
      b.*,
      c.first_name || ' ' || c.last_name as client_name,
      s.title as service_name,
      EXTRACT(EPOCH FROM (b.start_time - NOW())) / 3600 as hours_until_booking
    FROM bookings b
    LEFT JOIN clients c ON b.client_id = c.id
    LEFT JOIN services s ON b.service_id = s.id
    WHERE b.status = 'unassigned'
    AND b.start_time BETWEEN NOW() AND (NOW() + INTERVAL '48 hours')
    AND b.start_time > NOW() -- Only future bookings
  LOOP
    hours_until := FLOOR(booking_record.hours_until_booking);
    
    -- Determine notification urgency and content
    IF hours_until <= 2 THEN
      notification_title := 'URGENT: Unassigned booking starting soon!';
      notification_message := 'Booking for ' || booking_record.client_name || ' starts in ' || hours_until || ' hours and still needs carer assignment.';
    ELSIF hours_until <= 24 THEN
      notification_title := 'Reminder: Unassigned booking tomorrow';
      notification_message := 'Booking for ' || booking_record.client_name || ' on ' || TO_CHAR(booking_record.start_time, 'DD/MM/YYYY at HH24:MI') || ' still needs carer assignment.';
    ELSE
      notification_title := 'Unassigned booking requires attention';
      notification_message := 'Booking for ' || booking_record.client_name || ' on ' || TO_CHAR(booking_record.start_time, 'DD/MM/YYYY at HH24:MI') || ' needs carer assignment.';
    END IF;
    
    -- Create notifications for all branch admins
    FOR admin_record IN 
      SELECT ab.admin_id
      FROM admin_branches ab
      WHERE ab.branch_id = booking_record.branch_id
    LOOP
      -- Only create notification if one doesn't already exist for this booking and admin in the last 12 hours
      IF NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.user_id = admin_record.admin_id
        AND n.type = 'unassigned_booking'
        AND (n.data->>'booking_id')::uuid = booking_record.id
        AND n.created_at > (NOW() - INTERVAL '12 hours')
      ) THEN
        INSERT INTO notifications (
          user_id,
          branch_id,
          type,
          category,
          priority,
          title,
          message,
          data
        ) VALUES (
          admin_record.admin_id,
          booking_record.branch_id,
          'unassigned_booking',
          'warning',
          CASE 
            WHEN hours_until <= 2 THEN 'urgent'
            WHEN hours_until <= 24 THEN 'high'
            ELSE 'medium'
          END,
          notification_title,
          notification_message,
          jsonb_build_object(
            'booking_id', booking_record.id,
            'client_name', booking_record.client_name,
            'service_name', booking_record.service_name,
            'start_time', booking_record.start_time,
            'end_time', booking_record.end_time,
            'hours_until', hours_until,
            'action_required', true,
            'action_type', 'assign_carer'
          )
        );
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- Create function to automatically create immediate notification when booking is created without carer
CREATE OR REPLACE FUNCTION public.create_unassigned_booking_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record RECORD;
  client_name TEXT;
  service_name TEXT;
BEGIN
  -- Only process unassigned bookings
  IF NEW.status = 'unassigned' THEN
    -- Get client and service names
    SELECT c.first_name || ' ' || c.last_name INTO client_name
    FROM clients c WHERE c.id = NEW.client_id;
    
    SELECT s.title INTO service_name
    FROM services s WHERE s.id = NEW.service_id;
    
    -- Create notifications for all branch admins
    FOR admin_record IN 
      SELECT ab.admin_id
      FROM admin_branches ab
      WHERE ab.branch_id = NEW.branch_id
    LOOP
      INSERT INTO notifications (
        user_id,
        branch_id,
        type,
        category,
        priority,
        title,
        message,
        data
      ) VALUES (
        admin_record.admin_id,
        NEW.branch_id,
        'unassigned_booking',
        'info',
        'medium',
        'New unassigned booking created',
        'A booking for ' || COALESCE(client_name, 'Unknown Client') || ' on ' || 
        TO_CHAR(NEW.start_time, 'DD/MM/YYYY at HH24:MI') || ' was created without carer assignment.',
        jsonb_build_object(
          'booking_id', NEW.id,
          'client_name', COALESCE(client_name, 'Unknown Client'),
          'service_name', COALESCE(service_name, 'Unknown Service'),
          'start_time', NEW.start_time,
          'end_time', NEW.end_time,
          'action_required', true,
          'action_type', 'assign_carer',
          'created_unassigned', true
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for immediate notification on unassigned booking creation
DROP TRIGGER IF EXISTS trigger_unassigned_booking_notification ON bookings;
CREATE TRIGGER trigger_unassigned_booking_notification
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION create_unassigned_booking_notification();

-- Also trigger when a booking is updated to unassigned status
DROP TRIGGER IF EXISTS trigger_unassigned_booking_update_notification ON bookings;
CREATE TRIGGER trigger_unassigned_booking_update_notification
  AFTER UPDATE ON bookings
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'unassigned')
  EXECUTE FUNCTION create_unassigned_booking_notification();