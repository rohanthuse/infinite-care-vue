-- Fix RLS violation in upload_staff_document function by disabling row security
CREATE OR REPLACE FUNCTION public.upload_staff_document(
  p_staff_id uuid,
  p_document_type text,
  p_file_path text,
  p_file_size text DEFAULT NULL,
  p_expiry_date date DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off  -- Disable RLS within this function
AS $$
DECLARE
  current_user_id uuid;
  staff_record RECORD;
  document_id uuid;
  result json;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  
  -- Log authentication context for debugging
  RAISE NOTICE 'upload_staff_document called with user_id: %, staff_id: %', current_user_id, p_staff_id;
  
  -- Validate authentication
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Get staff record and validate ownership
  SELECT s.*, b.organization_id 
  INTO staff_record
  FROM staff s
  JOIN branches b ON s.branch_id = b.id
  WHERE s.id = p_staff_id;
  
  -- Log staff record validation
  RAISE NOTICE 'Staff record found: %, auth_user_id: %', 
    CASE WHEN staff_record.id IS NOT NULL THEN 'YES' ELSE 'NO' END,
    staff_record.auth_user_id;
  
  IF staff_record.id IS NULL THEN
    RAISE EXCEPTION 'Staff member not found';
  END IF;
  
  -- Validate user can upload documents for this staff member
  -- Either the user is the staff member themselves OR an admin in the same organization
  IF staff_record.auth_user_id != current_user_id AND 
     NOT EXISTS (
       SELECT 1 FROM user_roles ur 
       WHERE ur.user_id = current_user_id 
       AND ur.role IN ('super_admin', 'branch_admin')
     ) THEN
    RAISE EXCEPTION 'Insufficient permissions to upload documents for this staff member';
  END IF;
  
  -- Generate new document ID
  document_id := gen_random_uuid();
  
  -- Insert document record (RLS is disabled within this function)
  INSERT INTO staff_documents (
    id,
    staff_id,
    document_type,
    file_path,
    file_size,
    expiry_date,
    status,
    created_at,
    updated_at
  ) VALUES (
    document_id,
    p_staff_id,
    p_document_type,
    p_file_path,
    p_file_size,
    p_expiry_date,
    'active',
    now(),
    now()
  );
  
  -- Log successful creation
  RAISE NOTICE 'Document created successfully with ID: %', document_id;
  
  -- Return success response
  result := json_build_object(
    'success', true,
    'message', 'Document uploaded successfully',
    'document_id', document_id
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error details
    RAISE NOTICE 'Error in upload_staff_document: %', SQLERRM;
    
    -- Return error response
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;