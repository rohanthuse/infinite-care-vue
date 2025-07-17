-- Add event occurrence date and time columns to client_events_logs
ALTER TABLE public.client_events_logs 
ADD COLUMN IF NOT EXISTS event_date DATE,
ADD COLUMN IF NOT EXISTS event_time TIME WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS recorded_by_staff_id UUID REFERENCES public.staff(id);

-- Add index for better performance on event_date queries
CREATE INDEX IF NOT EXISTS idx_client_events_logs_event_date ON public.client_events_logs(event_date);

-- Add index for recorded_by_staff_id
CREATE INDEX IF NOT EXISTS idx_client_events_logs_recorded_by_staff_id ON public.client_events_logs(recorded_by_staff_id);

-- Set default values for existing records (event_date from created_at, event_time from created_at)
UPDATE public.client_events_logs 
SET 
  event_date = DATE(created_at),
  event_time = TIME(created_at)
WHERE event_date IS NULL OR event_time IS NULL;