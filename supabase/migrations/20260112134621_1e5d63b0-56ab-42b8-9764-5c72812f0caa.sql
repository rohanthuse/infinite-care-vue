-- Add staff_id column for carer-specific holidays
ALTER TABLE annual_leave_calendar 
ADD COLUMN staff_id uuid REFERENCES staff(id) ON DELETE CASCADE;

-- Add is_weekly_recurring column for weekly recurring holidays
ALTER TABLE annual_leave_calendar 
ADD COLUMN is_weekly_recurring boolean DEFAULT false;

-- Create index for faster queries on staff_id
CREATE INDEX idx_annual_leave_calendar_staff_id ON annual_leave_calendar(staff_id);