-- Add missing columns to organizations table for company profile settings
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS registration_number TEXT,
ADD COLUMN IF NOT EXISTS director TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

-- Note: country column already exists in organizations table

-- Add helpful comment
COMMENT ON COLUMN organizations.registration_number IS 'Company registration number for legal identification';
COMMENT ON COLUMN organizations.director IS 'Name of company director';
COMMENT ON COLUMN organizations.website IS 'Company website URL';