
-- Add staff_id column to client_care_plans table for proper linking
ALTER TABLE public.client_care_plans 
ADD COLUMN staff_id uuid REFERENCES public.staff(id);

-- Add a constraint to ensure logical consistency
-- Either staff_id is provided (internal staff) OR provider_name is provided (external provider)
ALTER TABLE public.client_care_plans 
ADD CONSTRAINT check_provider_assignment 
CHECK (
  (staff_id IS NOT NULL AND provider_name IS NOT NULL) OR 
  (staff_id IS NULL AND provider_name IS NOT NULL)
);

-- Update existing care plan to link "Dr. Sarah Johnson" to the actual staff record
UPDATE public.client_care_plans 
SET staff_id = '550e8400-e29b-41d4-a716-446655440099'
WHERE provider_name = 'Dr. Sarah Johnson';

-- Add an index for better performance on staff lookups
CREATE INDEX idx_client_care_plans_staff_id ON public.client_care_plans(staff_id);
