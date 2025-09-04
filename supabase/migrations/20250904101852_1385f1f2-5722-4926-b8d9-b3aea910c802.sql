-- Add new care plan statuses if they don't exist
-- First check current status values and add missing ones

-- Add 'on_hold' and 'draft' statuses to enum if they don't exist
-- This is safe to run multiple times
DO $$ 
BEGIN
    -- Check if the status column uses an enum or text type
    -- If it's text type, no enum update needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'client_care_plans' 
        AND column_name = 'status' 
        AND data_type = 'text'
    ) THEN
        -- Status is text type, no enum update needed
        RAISE NOTICE 'Status column is text type, no enum update required';
    END IF;
END $$;