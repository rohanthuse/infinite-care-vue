-- Fix RLS violation by making staff_id NOT NULL and adding better error handling

-- First, let's check the current structure of staff_documents table
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'staff_documents' 
AND table_schema = 'public';

-- Make staff_id NOT NULL to prevent RLS issues
ALTER TABLE public.staff_documents 
ALTER COLUMN staff_id SET NOT NULL;

-- Add a constraint to ensure staff_id references a valid staff record
ALTER TABLE public.staff_documents 
ADD CONSTRAINT fk_staff_documents_staff_id 
FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE CASCADE;

-- Create a function to verify staff authentication context
CREATE OR REPLACE FUNCTION public.verify_staff_auth_context()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  staff_record_id uuid;
BEGIN
  -- Get the staff record ID for the currently authenticated user
  SELECT s.id INTO staff_record_id
  FROM public.staff s
  WHERE s.auth_user_id = auth.uid();
  
  IF staff_record_id IS NULL THEN
    RAISE EXCEPTION 'No staff record found for authenticated user';
  END IF;
  
  RETURN staff_record_id;
END;
$$;