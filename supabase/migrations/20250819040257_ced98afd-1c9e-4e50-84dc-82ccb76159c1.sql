-- Create secure function to upload staff documents bypassing RLS issues
CREATE OR REPLACE FUNCTION public.upload_staff_document(
  p_staff_id uuid,
  p_document_type text,
  p_file_path text,
  p_file_size text,
  p_file_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_document_id uuid;
  current_user_id uuid;
BEGIN
  -- Get the current authenticated user
  current_user_id := auth.uid();
  
  -- Log for debugging
  RAISE NOTICE 'Upload function called - Auth User ID: %, Staff ID: %', current_user_id, p_staff_id;
  
  -- Verify the authenticated user owns this staff record
  IF NOT EXISTS (
    SELECT 1 FROM public.staff 
    WHERE id = p_staff_id 
    AND (auth_user_id = current_user_id OR id = current_user_id)
  ) THEN
    RAISE EXCEPTION 'Access denied: User does not own this staff record';
  END IF;
  
  -- Insert the document record
  INSERT INTO public.staff_documents (
    staff_id,
    document_type,
    file_path,
    file_size,
    file_name,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_staff_id,
    p_document_type,
    p_file_path,
    p_file_size,
    p_file_name,
    'active',
    now(),
    now()
  ) RETURNING id INTO new_document_id;
  
  RAISE NOTICE 'Document created successfully with ID: %', new_document_id;
  
  RETURN new_document_id;
END;
$$;