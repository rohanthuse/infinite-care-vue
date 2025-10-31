-- Drop existing unique constraint that prevents staff from taking same course multiple times
-- The constraint might be named either way depending on when it was created
ALTER TABLE staff_training_records 
DROP CONSTRAINT IF EXISTS staff_training_records_staff_id_training_course_id_key;

ALTER TABLE staff_training_records 
DROP CONSTRAINT IF EXISTS unique_staff_training_course;

-- Add new constraint that allows same course on different dates
-- This enables refresher training and recertification while still preventing duplicate bookings on same day
ALTER TABLE staff_training_records 
ADD CONSTRAINT unique_staff_training_course_date 
UNIQUE (staff_id, training_course_id, assigned_date);