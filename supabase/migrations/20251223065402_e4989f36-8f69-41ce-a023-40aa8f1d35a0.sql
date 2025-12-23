-- Add is_vatable column to service_rates table for proper VAT configuration
ALTER TABLE public.service_rates 
ADD COLUMN IF NOT EXISTS is_vatable BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.service_rates.is_vatable IS 'Whether this rate is subject to VAT (Value Added Tax)';