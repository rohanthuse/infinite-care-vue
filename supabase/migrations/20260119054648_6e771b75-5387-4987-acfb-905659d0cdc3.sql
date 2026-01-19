-- Add created_by_name column to service_rates table
ALTER TABLE service_rates 
ADD COLUMN IF NOT EXISTS created_by_name TEXT;