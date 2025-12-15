-- Add overtime and extra time fields to staff_rate_schedules table
ALTER TABLE public.staff_rate_schedules
ADD COLUMN IF NOT EXISTS overtime_multiplier numeric DEFAULT 1.5,
ADD COLUMN IF NOT EXISTS overtime_threshold_hours numeric DEFAULT 40,
ADD COLUMN IF NOT EXISTS extra_time_rate numeric DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.staff_rate_schedules.overtime_multiplier IS 'Multiplier applied to base rate for overtime hours (e.g., 1.5 for time and a half)';
COMMENT ON COLUMN public.staff_rate_schedules.overtime_threshold_hours IS 'Number of hours after which overtime rate applies (default 40)';
COMMENT ON COLUMN public.staff_rate_schedules.extra_time_rate IS 'Specific rate for extra time work, if different from base rate. NULL means use base rate.';