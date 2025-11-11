-- Fix notification system: Add admin association and comprehensive booking notification triggers

-- Step 1: Add user as branch admin
INSERT INTO admin_branches (admin_id, branch_id)
VALUES ('3b38cad2-c98e-4bbd-bd36-dbdb06f913ca', '5154628c-e5f6-492b-85ab-a46b3e454885')
ON CONFLICT DO NOTHING;

-- Step 2: Create booking creation notification trigger
CREATE OR REPLACE FUNCTION public.notify_on_booking_created()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
  client_name TEXT;
  carer_name TEXT;
  carer_auth_id UUID;
BEGIN
  -- Get client name
  SELECT CONCAT(first_name, ' ', last_name) INTO client_name
  FROM public.clients WHERE id = NEW.client_id;
  
  -- If carer assigned, notify them
  IF NEW.staff_id IS NOT NULL THEN
    SELECT 
      CONCAT(first_name, ' ', last_name),
      auth_user_id
    INTO carer_name, carer_auth_id
    FROM public.staff WHERE id = NEW.staff_id;
    
    -- Notify carer using safe_notify
    IF carer_auth_id IS NOT NULL THEN
      PERFORM public.safe_notify(
        carer_auth_id,
        NEW.branch_id,
        'booking',
        'info',
        'medium',
        'New Booking Assigned',
        'You have been assigned to ' || client_name || ' on ' || 
        TO_CHAR(NEW.start_time, 'DD/MM/YYYY at HH24:MI'),
        jsonb_build_object(
          'booking_id', NEW.id,
          'client_id', NEW.client_id,
          'client_name', client_name,
          'start_time', NEW.start_time,
          'end_time', NEW.end_time
        )
      );
    END IF;
  END IF;
  
  -- Notify all admins
  FOR admin_record IN 
    SELECT admin_id FROM public.admin_branches WHERE branch_id = NEW.branch_id
  LOOP
    PERFORM public.safe_notify(
      admin_record.admin_id,
      NEW.branch_id,
      'booking',
      'info',
      'low',
      'New Booking Created',
      'Booking created for ' || client_name || 
      CASE WHEN NEW.staff_id IS NOT NULL 
        THEN ' (assigned to ' || carer_name || ')'
        ELSE ' (unassigned)'
      END,
      jsonb_build_object(
        'booking_id', NEW.id,
        'client_id', NEW.client_id,
        'client_name', client_name,
        'carer_name', carer_name,
        'start_time', NEW.start_time
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER booking_creation_notification
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_booking_created();

-- Step 3: Create booking assignment notification trigger
CREATE OR REPLACE FUNCTION public.notify_on_booking_assigned()
RETURNS TRIGGER AS $$
DECLARE
  carer_auth_id UUID;
  carer_name TEXT;
  client_name TEXT;
BEGIN
  -- Only trigger if staff_id changed from NULL to a value
  IF OLD.staff_id IS NULL AND NEW.staff_id IS NOT NULL THEN
    -- Get carer details
    SELECT auth_user_id, CONCAT(first_name, ' ', last_name)
    INTO carer_auth_id, carer_name
    FROM public.staff WHERE id = NEW.staff_id;
    
    -- Get client name
    SELECT CONCAT(first_name, ' ', last_name) INTO client_name
    FROM public.clients WHERE id = NEW.client_id;
    
    -- Notify carer using safe_notify
    IF carer_auth_id IS NOT NULL THEN
      PERFORM public.safe_notify(
        carer_auth_id,
        NEW.branch_id,
        'booking',
        'info',
        'high',
        'Booking Assigned to You',
        'You have been assigned to ' || client_name || ' on ' || 
        TO_CHAR(NEW.start_time, 'DD/MM/YYYY at HH24:MI'),
        jsonb_build_object(
          'booking_id', NEW.id,
          'client_id', NEW.client_id,
          'client_name', client_name,
          'start_time', NEW.start_time,
          'end_time', NEW.end_time
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER booking_assignment_notification
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  WHEN (OLD.staff_id IS DISTINCT FROM NEW.staff_id)
  EXECUTE FUNCTION public.notify_on_booking_assigned();

-- Step 4: Create booking completion notification trigger
CREATE OR REPLACE FUNCTION public.notify_on_booking_completed()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
  carer_name TEXT;
  client_name TEXT;
BEGIN
  -- Only trigger when status changes to completed/done
  IF OLD.status IS DISTINCT FROM NEW.status 
     AND NEW.status IN ('completed', 'done') THEN
    
    -- Get names
    SELECT CONCAT(first_name, ' ', last_name) INTO carer_name
    FROM public.staff WHERE id = NEW.staff_id;
    
    SELECT CONCAT(first_name, ' ', last_name) INTO client_name
    FROM public.clients WHERE id = NEW.client_id;
    
    -- Notify all admins
    FOR admin_record IN 
      SELECT admin_id FROM public.admin_branches WHERE branch_id = NEW.branch_id
    LOOP
      PERFORM public.safe_notify(
        admin_record.admin_id,
        NEW.branch_id,
        'task',
        'success',
        'low',
        'Booking Completed',
        carer_name || ' completed visit with ' || client_name,
        jsonb_build_object(
          'booking_id', NEW.id,
          'client_id', NEW.client_id,
          'staff_id', NEW.staff_id,
          'client_name', client_name,
          'carer_name', carer_name,
          'completed_at', NEW.updated_at,
          'start_time', NEW.start_time,
          'end_time', NEW.end_time
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER booking_completion_notification
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_on_booking_completed();