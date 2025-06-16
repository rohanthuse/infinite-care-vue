
-- Add additional fields to the branches table for complete branch information
ALTER TABLE public.branches 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS operating_hours TEXT,
ADD COLUMN IF NOT EXISTS established_date DATE;

-- Update existing branches with some default values if needed
UPDATE public.branches 
SET 
  operating_hours = 'Mon-Fri: 8:00 - 18:00',
  established_date = '2020-01-01'
WHERE operating_hours IS NULL OR established_date IS NULL;
