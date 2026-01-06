-- Add missing columns to client_dietary_requirements table
ALTER TABLE client_dietary_requirements
ADD COLUMN IF NOT EXISTS hydration_needs TEXT,
ADD COLUMN IF NOT EXISTS meal_preparation_needs TEXT,
ADD COLUMN IF NOT EXISTS eating_assistance TEXT;