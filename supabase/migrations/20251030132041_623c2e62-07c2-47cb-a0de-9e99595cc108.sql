-- Phase 1: Fix Data Integrity Issues

-- Step 1: Fix orphaned assignments (status='assigned' but no staff_id)
UPDATE bookings
SET status = 'unassigned'
WHERE status = 'assigned' 
  AND staff_id IS NULL;

-- Step 2: Fix reverse cases (staff_id assigned but status='unassigned')
UPDATE bookings
SET status = 'assigned'
WHERE status = 'unassigned' 
  AND staff_id IS NOT NULL;

-- Step 3: Create constraint function to prevent future inconsistencies
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
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger to enforce the constraint
DROP TRIGGER IF EXISTS booking_staff_status_validation ON bookings;
CREATE TRIGGER booking_staff_status_validation
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION validate_booking_staff_status();

-- Step 5: Add comment for documentation
COMMENT ON FUNCTION validate_booking_staff_status() IS 
  'Validates that booking status and staff_id are consistent. 
   - Assigned/in-progress/done bookings must have a carer
   - Unassigned bookings cannot have a carer
   - Auto-corrects status when staff_id changes';