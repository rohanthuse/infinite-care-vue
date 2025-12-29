-- Add time_of_day column to client_medications table
-- This allows users to specify when medications should be taken (morning, afternoon, evening, night)
ALTER TABLE client_medications
ADD COLUMN time_of_day TEXT[] DEFAULT NULL;