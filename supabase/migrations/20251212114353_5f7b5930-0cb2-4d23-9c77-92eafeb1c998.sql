-- Add start_time and end_time columns to annual_leave_calendar table
ALTER TABLE public.annual_leave_calendar 
ADD COLUMN start_time time,
ADD COLUMN end_time time;

-- Add comment for documentation
COMMENT ON COLUMN public.annual_leave_calendar.start_time IS 'Start time of the leave period (null means all day)';
COMMENT ON COLUMN public.annual_leave_calendar.end_time IS 'End time of the leave period (null means all day)';