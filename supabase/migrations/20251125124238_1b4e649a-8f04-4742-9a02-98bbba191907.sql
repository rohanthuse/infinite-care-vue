-- Add file_name and description columns to staff_documents table
ALTER TABLE public.staff_documents 
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update the RPC function to accept new parameters
CREATE OR REPLACE FUNCTION public.upload_staff_document_bypass_rls(
  p_staff_id uuid,
  p_document_type text,
  p_file_path text,
  p_file_size text DEFAULT NULL,
  p_expiry_date date DEFAULT NULL,
  p_file_name text DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_document_id uuid;
BEGIN
  -- Insert the document with new fields
  INSERT INTO public.staff_documents (
    staff_id,
    document_type,
    file_path,
    file_size,
    expiry_date,
    file_name,
    description,
    status
  ) VALUES (
    p_staff_id,
    p_document_type,
    p_file_path,
    p_file_size,
    p_expiry_date,
    p_file_name,
    p_description,
    'active'
  )
  RETURNING id INTO new_document_id;
  
  RETURN json_build_object(
    'success', true,
    'document_id', new_document_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;