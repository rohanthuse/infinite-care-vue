-- Drop existing FK constraint on approved_by -> staff.id
ALTER TABLE extra_time_records
DROP CONSTRAINT IF EXISTS extra_time_records_approved_by_fkey;

-- Add new FK constraint on approved_by -> profiles.id
ALTER TABLE extra_time_records
ADD CONSTRAINT extra_time_records_approved_by_fkey
FOREIGN KEY (approved_by) REFERENCES profiles(id);