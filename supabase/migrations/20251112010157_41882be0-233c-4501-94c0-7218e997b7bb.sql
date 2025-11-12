-- First, alter columns to allow NULL if they don't already
ALTER TABLE visit_records ALTER COLUMN staff_id DROP NOT NULL;
ALTER TABLE visit_records ALTER COLUMN client_id DROP NOT NULL;
ALTER TABLE visit_records ALTER COLUMN booking_id DROP NOT NULL;

-- Clean up orphaned staff_id references
UPDATE visit_records 
SET staff_id = NULL 
WHERE staff_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM staff WHERE staff.id = visit_records.staff_id);

-- Clean up orphaned client_id references  
UPDATE visit_records
SET client_id = NULL
WHERE client_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM clients WHERE clients.id = visit_records.client_id);

-- Clean up orphaned booking_id references
UPDATE visit_records
SET booking_id = NULL
WHERE booking_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bookings WHERE bookings.id = visit_records.booking_id);

-- Add foreign key for staff_id
ALTER TABLE visit_records
ADD CONSTRAINT visit_records_staff_id_fkey
FOREIGN KEY (staff_id)
REFERENCES staff(id)
ON DELETE SET NULL;

-- Add foreign key for client_id
ALTER TABLE visit_records
ADD CONSTRAINT visit_records_client_id_fkey
FOREIGN KEY (client_id)
REFERENCES clients(id)
ON DELETE SET NULL;

-- Add foreign key for booking_id (check if it exists first)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'visit_records_booking_id_fkey'
    AND table_name = 'visit_records'
  ) THEN
    ALTER TABLE visit_records
    ADD CONSTRAINT visit_records_booking_id_fkey
    FOREIGN KEY (booking_id)
    REFERENCES bookings(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_visit_records_staff_id ON visit_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_visit_records_client_id ON visit_records(client_id);
CREATE INDEX IF NOT EXISTS idx_visit_records_booking_id ON visit_records(booking_id);