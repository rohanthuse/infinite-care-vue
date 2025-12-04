-- Step 1: Fix existing bookings with NULL branch_id by using client's branch_id
UPDATE bookings 
SET branch_id = clients.branch_id
FROM clients 
WHERE bookings.client_id = clients.id 
  AND bookings.branch_id IS NULL
  AND clients.branch_id IS NOT NULL;

-- Step 2: Create validation function to ensure branch_id is always set
CREATE OR REPLACE FUNCTION validate_booking_branch_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.branch_id IS NULL AND NEW.client_id IS NOT NULL THEN
    -- Try to get branch_id from client
    SELECT branch_id INTO NEW.branch_id
    FROM clients
    WHERE id = NEW.client_id;
  END IF;
  
  -- If still NULL after trying to get from client, raise an error
  IF NEW.branch_id IS NULL THEN
    RAISE EXCEPTION 'branch_id is required for bookings';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger to run validation before insert/update
DROP TRIGGER IF EXISTS ensure_booking_branch_id ON bookings;
CREATE TRIGGER ensure_booking_branch_id
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION validate_booking_branch_id();