
-- Add display_id column to client_care_plans table
ALTER TABLE public.client_care_plans 
ADD COLUMN display_id TEXT UNIQUE;

-- Update existing records with proper sequential display IDs
WITH numbered_plans AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM public.client_care_plans
)
UPDATE public.client_care_plans 
SET display_id = 'CP-' || LPAD(numbered_plans.row_num::TEXT, 3, '0')
FROM numbered_plans 
WHERE public.client_care_plans.id = numbered_plans.id;

-- Make display_id NOT NULL after populating existing records
ALTER TABLE public.client_care_plans 
ALTER COLUMN display_id SET NOT NULL;

-- Create function to auto-generate display_id for new care plans
CREATE OR REPLACE FUNCTION generate_care_plan_display_id()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
BEGIN
    -- Get the next sequential number
    SELECT COALESCE(MAX(CAST(SUBSTRING(display_id FROM 4) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.client_care_plans
    WHERE display_id ~ '^CP-[0-9]+$';
    
    -- Set the display_id
    NEW.display_id = 'CP-' || LPAD(next_num::TEXT, 3, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate display_id on insert
CREATE TRIGGER set_care_plan_display_id
    BEFORE INSERT ON public.client_care_plans
    FOR EACH ROW
    WHEN (NEW.display_id IS NULL)
    EXECUTE FUNCTION generate_care_plan_display_id();
