-- Add VAT applicability field to client rate schedules
ALTER TABLE public.client_rate_schedules 
ADD COLUMN is_vatable boolean NOT NULL DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.client_rate_schedules.is_vatable IS 'Indicates if this rate schedule is subject to VAT';

-- Update existing records to have default VAT setting
UPDATE public.client_rate_schedules 
SET is_vatable = false 
WHERE is_vatable IS NULL;