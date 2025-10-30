-- Fix search_path security warning for the booking validation function
CREATE OR REPLACE FUNCTION validate_booking_staff_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If status is 'assigned', 'in-progress', 'done', or 'departed', staff_id must not be null
  IF NEW.status IN ('assigned', 'in-progress', 'done', 'departed') AND NEW.staff_id IS NULL THEN
    RAISE EXCEPTION 'Cannot set status to % without assigning a carer (staff_id)', NEW.status;
  END IF;
  
  -- If staff_id is being set, status cannot be 'unassigned'
  IF NEW.staff_id IS NOT NULL AND NEW.status = 'unassigned' THEN
    NEW.status := 'assigned';
  END IF;
  
  -- If staff_id is being cleared, status should be 'unassigned' or 'cancelled'
  IF NEW.staff_id IS NULL AND NEW.status NOT IN ('unassigned', 'cancelled', 'suspended') THEN
    NEW.status := 'unassigned';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp
SECURITY DEFINER;