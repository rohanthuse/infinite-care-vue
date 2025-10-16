-- Add notes column to client_medications table
ALTER TABLE public.client_medications 
ADD COLUMN notes text NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.client_medications.notes IS 'Additional notes about the medication including prescribed by information and other relevant details';