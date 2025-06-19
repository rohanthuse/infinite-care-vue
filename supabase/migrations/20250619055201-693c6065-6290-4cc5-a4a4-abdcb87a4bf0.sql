
-- Add the missing enum values in separate statements
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'carer'; 
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'client';
