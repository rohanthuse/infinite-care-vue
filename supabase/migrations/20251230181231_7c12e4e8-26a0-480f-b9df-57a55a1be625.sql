-- Add time_of_day and duration columns to client_activities table
ALTER TABLE client_activities 
ADD COLUMN IF NOT EXISTS time_of_day text[] DEFAULT NULL;

ALTER TABLE client_activities 
ADD COLUMN IF NOT EXISTS duration text DEFAULT NULL;