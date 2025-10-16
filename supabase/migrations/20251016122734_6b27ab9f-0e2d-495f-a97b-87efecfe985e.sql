-- Phase 1: Fix the documents INSERT policy to use auth_user_id for staff checks
DROP POLICY IF EXISTS "Users can upload documents in their branch" ON public.documents;

CREATE POLICY "Users can upload documents in their branch"
  ON public.documents
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      -- Super admin can upload anywhere
      has_role(auth.uid(), 'super_admin'::app_role) OR
      -- Admin can upload to their branch
      branch_id IN (
        SELECT ab.branch_id 
        FROM public.admin_branches ab 
        WHERE ab.admin_id = auth.uid()
      ) OR
      -- Staff can upload to their branch (FIXED: using auth_user_id instead of id)
      branch_id IN (
        SELECT s.branch_id 
        FROM public.staff s 
        WHERE s.auth_user_id = auth.uid()
      )
    )
  );

-- Phase 2: Create diagnostic function to check document upload access
CREATE OR REPLACE FUNCTION public.check_document_upload_access(p_branch_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_result JSON;
  v_is_super_admin BOOLEAN;
  v_is_branch_admin BOOLEAN;
  v_is_branch_staff BOOLEAN;
  v_staff_record RECORD;
  v_user_roles TEXT[];
BEGIN
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'error', 'User not authenticated',
      'can_upload', false
    );
  END IF;

  -- Get user roles
  SELECT ARRAY_AGG(role::TEXT) INTO v_user_roles
  FROM public.user_roles
  WHERE user_id = v_user_id;
  
  -- Check super admin
  SELECT has_role(v_user_id, 'super_admin'::app_role) INTO v_is_super_admin;
  
  -- Check branch admin
  SELECT EXISTS(
    SELECT 1 FROM public.admin_branches ab 
    WHERE ab.admin_id = v_user_id AND ab.branch_id = p_branch_id
  ) INTO v_is_branch_admin;
  
  -- Check branch staff and get staff record
  SELECT s.* INTO v_staff_record
  FROM public.staff s 
  WHERE s.auth_user_id = v_user_id AND s.branch_id = p_branch_id
  LIMIT 1;
  
  v_is_branch_staff := (v_staff_record IS NOT NULL);
  
  v_result := json_build_object(
    'user_id', v_user_id,
    'branch_id', p_branch_id,
    'user_roles', v_user_roles,
    'is_super_admin', v_is_super_admin,
    'is_branch_admin', v_is_branch_admin,
    'is_branch_staff', v_is_branch_staff,
    'can_upload', (v_is_super_admin OR v_is_branch_admin OR v_is_branch_staff),
    'staff_record', CASE 
      WHEN v_staff_record IS NOT NULL THEN 
        json_build_object(
          'id', v_staff_record.id,
          'auth_user_id', v_staff_record.auth_user_id,
          'first_name', v_staff_record.first_name,
          'last_name', v_staff_record.last_name,
          'email', v_staff_record.email
        )
      ELSE NULL
    END
  );
  
  RETURN v_result;
END;
$$;