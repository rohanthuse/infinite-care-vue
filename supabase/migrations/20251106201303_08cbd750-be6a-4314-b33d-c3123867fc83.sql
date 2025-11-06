-- Add billing_address field to client_accounting_settings table
ALTER TABLE client_accounting_settings 
ADD COLUMN IF NOT EXISTS billing_address TEXT;

-- Add comment for documentation
COMMENT ON COLUMN client_accounting_settings.billing_address IS 'Separate billing address when different from personal address';