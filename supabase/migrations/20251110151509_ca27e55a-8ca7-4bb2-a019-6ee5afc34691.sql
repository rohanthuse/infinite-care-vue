-- Drop the old constraint that includes assigned_date
ALTER TABLE staff_training_records 
DROP CONSTRAINT IF EXISTS unique_staff_training_course_date;

-- Add new constraint on just staff_id and training_course_id
-- This allows one record per staff per course, enabling proper upserts
ALTER TABLE staff_training_records 
ADD CONSTRAINT unique_staff_training_course 
UNIQUE (staff_id, training_course_id);