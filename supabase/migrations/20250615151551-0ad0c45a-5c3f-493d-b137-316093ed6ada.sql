
-- Add new columns to the branches table
ALTER TABLE public.branches
ADD COLUMN country TEXT,
ADD COLUMN currency TEXT,
ADD COLUMN regulatory TEXT,
ADD COLUMN branch_type TEXT,
ADD COLUMN status TEXT,
ADD COLUMN created_by TEXT,
ADD COLUMN updated_at TIMESTAMPTZ;

-- Set default values for existing records
UPDATE public.branches SET
    country = 'England',
    currency = '£',
    regulatory = 'CQC',
    branch_type = 'HomeCare',
    status = 'Active'
WHERE country IS NULL;

-- Make columns not-nullable since they are now populated
ALTER TABLE public.branches
ALTER COLUMN country SET NOT NULL,
ALTER COLUMN currency SET NOT NULL,
ALTER COLUMN regulatory SET NOT NULL,
ALTER COLUMN branch_type SET NOT NULL,
ALTER COLUMN status SET NOT NULL;

-- Create a trigger to automatically update the 'updated_at' column on row update
CREATE TRIGGER handle_branch_update
BEFORE UPDATE ON public.branches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
