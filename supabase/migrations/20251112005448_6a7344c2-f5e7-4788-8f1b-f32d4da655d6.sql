-- Step 1: Remove NOT NULL constraint from booking_id to allow orphaned records to be cleaned up
ALTER TABLE visit_records 
ALTER COLUMN booking_id DROP NOT NULL;

-- Step 2: Clean up orphaned booking_id references in visit_records
-- Set booking_id to NULL where the booking doesn't exist
UPDATE visit_records
SET booking_id = NULL
WHERE booking_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM bookings WHERE bookings.id = visit_records.booking_id
  );

-- Step 3: Add foreign key constraint between visit_records and bookings
ALTER TABLE visit_records
ADD CONSTRAINT visit_records_booking_id_fkey
FOREIGN KEY (booking_id)
REFERENCES bookings(id)
ON DELETE SET NULL;

-- Step 4: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_visit_records_booking_id 
ON visit_records(booking_id);