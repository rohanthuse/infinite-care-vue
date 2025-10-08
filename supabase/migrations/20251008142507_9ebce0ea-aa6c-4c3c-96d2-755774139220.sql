-- Add status column to services table for soft delete functionality
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
CHECK (status IN ('active', 'inactive', 'archived'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_services_status ON public.services(status);

-- Update all existing records to have 'active' status
UPDATE public.services 
SET status = 'active' 
WHERE status IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.services.status IS 'Service status: active, inactive, or archived. Inactive services are soft-deleted.';