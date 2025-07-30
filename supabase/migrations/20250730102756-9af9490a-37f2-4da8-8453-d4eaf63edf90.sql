-- Fix foreign key constraint on annual_leave_calendar.created_by
-- The current constraint references staff(id) but we're using auth.uid() which may not be in staff table

-- First, drop the existing foreign key constraint that references staff
ALTER TABLE annual_leave_calendar 
DROP CONSTRAINT IF EXISTS annual_leave_calendar_created_by_fkey;

-- Add a new foreign key constraint that references auth.users instead
ALTER TABLE annual_leave_calendar 
ADD CONSTRAINT annual_leave_calendar_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;