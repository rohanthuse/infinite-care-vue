-- Add NEWS2 monitoring fields to client_care_plans table
ALTER TABLE public.client_care_plans 
ADD COLUMN news2_monitoring_enabled boolean DEFAULT false,
ADD COLUMN news2_monitoring_frequency text DEFAULT 'daily',
ADD COLUMN news2_monitoring_notes text;

-- Add comment to explain the new columns
COMMENT ON COLUMN public.client_care_plans.news2_monitoring_enabled IS 'Whether NEWS2 health monitoring is enabled for this care plan';
COMMENT ON COLUMN public.client_care_plans.news2_monitoring_frequency IS 'Frequency of NEWS2 monitoring (daily, twice_daily, weekly)';
COMMENT ON COLUMN public.client_care_plans.news2_monitoring_notes IS 'Additional notes for NEWS2 monitoring setup';