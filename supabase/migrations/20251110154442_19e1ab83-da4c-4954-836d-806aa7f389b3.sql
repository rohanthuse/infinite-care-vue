-- Drop existing foreign key constraint
ALTER TABLE staff_training_records 
DROP CONSTRAINT IF EXISTS staff_training_records_training_course_id_fkey;

-- Add new constraint with CASCADE DELETE
-- This ensures when a training course is deleted, all related staff training records are automatically removed
ALTER TABLE staff_training_records 
ADD CONSTRAINT staff_training_records_training_course_id_fkey 
FOREIGN KEY (training_course_id) 
REFERENCES training_courses(id) 
ON DELETE CASCADE;