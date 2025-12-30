-- Add time_of_day column to client_care_plan_goals for time-based filtering
ALTER TABLE public.client_care_plan_goals 
ADD COLUMN IF NOT EXISTS time_of_day text[] DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.client_care_plan_goals.time_of_day IS 'Array of time slots when this goal is relevant (morning, afternoon, evening, night)';