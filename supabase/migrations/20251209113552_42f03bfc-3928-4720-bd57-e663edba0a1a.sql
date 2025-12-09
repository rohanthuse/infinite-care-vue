-- Add authority_category column to client_accounting_settings
ALTER TABLE client_accounting_settings 
ADD COLUMN IF NOT EXISTS authority_category text DEFAULT 'private';

-- Add comment for clarity
COMMENT ON COLUMN client_accounting_settings.authority_category IS 
'Payer category: private, local_authority, nhs, insurance, charity, other';