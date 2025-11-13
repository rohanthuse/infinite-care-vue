-- Fix the notify_on_booking_completed trigger to use NOW() instead of NEW.updated_at
CREATE OR REPLACE FUNCTION public.notify_on_booking_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
          'completed_at', NOW(),
          'start_time', NEW.start_time,
          'end_time', NEW.end_time
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;