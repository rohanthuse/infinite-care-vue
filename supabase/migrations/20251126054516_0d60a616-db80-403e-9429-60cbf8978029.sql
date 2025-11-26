-- Add created_by column to track who added each medication
ALTER TABLE public.client_medications 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.staff(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_client_medications_created_by 
ON public.client_medications(created_by);

-- Add comment for documentation
COMMENT ON COLUMN public.client_medications.created_by IS 'Staff member who created/added this medication';