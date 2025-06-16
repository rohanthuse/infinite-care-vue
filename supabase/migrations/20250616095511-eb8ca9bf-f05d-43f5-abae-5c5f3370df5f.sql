
-- First, let's identify and remove any overlapping bookings for the same carer
WITH overlapping_bookings AS (
  SELECT 
    b1.id as booking1_id,
    b2.id as booking2_id,
    b1.staff_id,
    b1.start_time as start1,
    b1.end_time as end1,
    b2.start_time as start2,
    b2.end_time as end2
  FROM bookings b1
  JOIN bookings b2 ON b1.staff_id = b2.staff_id 
    AND b1.id != b2.id
    AND b1.branch_id = b2.branch_id
    AND DATE(b1.start_time) = DATE(b2.start_time)
    AND b1.start_time < b2.end_time 
    AND b1.end_time > b2.start_time
  WHERE b1.branch_id = '9c5613f3-2c87-4492-820d-143f634023bb'
),
bookings_to_delete AS (
  SELECT DISTINCT booking2_id as id_to_delete
  FROM overlapping_bookings
)
DELETE FROM bookings 
WHERE id IN (SELECT id_to_delete FROM bookings_to_delete);

-- Add a database constraint to prevent future overlapping bookings
CREATE OR REPLACE FUNCTION check_booking_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there are any overlapping bookings for the same staff member on the same date
  IF EXISTS (
    SELECT 1 FROM bookings 
    WHERE staff_id = NEW.staff_id 
    AND branch_id = NEW.branch_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND DATE(start_time) = DATE(NEW.start_time)
    AND NEW.start_time < end_time 
    AND NEW.end_time > start_time
  ) THEN
    RAISE EXCEPTION 'Booking conflict detected: This carer already has an appointment during this time slot';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT operations
DROP TRIGGER IF EXISTS booking_overlap_check_insert ON bookings;
CREATE TRIGGER booking_overlap_check_insert
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_booking_overlap();

-- Create trigger for UPDATE operations
DROP TRIGGER IF EXISTS booking_overlap_check_update ON bookings;
CREATE TRIGGER booking_overlap_check_update
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_booking_overlap();
