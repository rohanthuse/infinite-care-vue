
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Library files - view access" ON storage.objects;
DROP POLICY IF EXISTS "Library files - upload access" ON storage.objects;
DROP POLICY IF EXISTS "Library files - update access" ON storage.objects;
DROP POLICY IF EXISTS "Library files - delete access" ON storage.objects;

DROP POLICY IF EXISTS "Library resources - view access" ON public.library_resources;
DROP POLICY IF EXISTS "Library resources - create access" ON public.library_resources;
DROP POLICY IF EXISTS "Library resources - update access" ON public.library_resources;
DROP POLICY IF EXISTS "Library resources - delete access" ON public.library_resources;

-- Create fixed storage policies with super admin priority
CREATE POLICY "Library files - view access"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'library-resources' 
    AND (
      -- Super admins get immediate access (check FIRST)
      EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
      )
      OR
      -- Branch admins can access files in their associated branches
      (
        EXISTS (
          SELECT 1 FROM public.user_roles ur 
          WHERE ur.user_id = auth.uid() AND ur.role = 'branch_admin'
        )
        AND EXISTS (
          SELECT 1 FROM public.admin_branches ab
          WHERE ab.admin_id = auth.uid() 
          AND ab.branch_id::text = (storage.foldername(name))[1]
        )
      )
      OR
      -- Staff/carers can access files in their assigned branch
      (
        EXISTS (
          SELECT 1 FROM public.user_roles ur 
          WHERE ur.user_id = auth.uid() AND ur.role = 'carer'
        )
        AND EXISTS (
          SELECT 1 FROM public.staff s
          WHERE s.id = auth.uid() 
          AND s.branch_id::text = (storage.foldername(name))[1]
        )
      )
    )
  );

CREATE POLICY "Library files - upload access"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'library-resources'
    AND (
      -- Super admins can upload to any branch folder (check FIRST)
      EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
      )
      OR
      -- Branch admins can upload to their associated branches
      (
        EXISTS (
          SELECT 1 FROM public.user_roles ur 
          WHERE ur.user_id = auth.uid() AND ur.role = 'branch_admin'
        )
        AND EXISTS (
          SELECT 1 FROM public.admin_branches ab
          WHERE ab.admin_id = auth.uid() 
          AND ab.branch_id::text = (storage.foldername(name))[1]
        )
      )
      OR
      -- Staff/carers can upload to their assigned branch
      (
        EXISTS (
          SELECT 1 FROM public.user_roles ur 
          WHERE ur.user_id = auth.uid() AND ur.role = 'carer'
        )
        AND EXISTS (
          SELECT 1 FROM public.staff s
          WHERE s.id = auth.uid() 
          AND s.branch_id::text = (storage.foldername(name))[1]
        )
      )
    )
  );

CREATE POLICY "Library files - update access"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'library-resources'
    AND (
      -- Super admins can update any file (check FIRST)
      EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
      )
      OR
      -- File owners can update their files
      owner = auth.uid()
    )
  );

CREATE POLICY "Library files - delete access"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'library-resources'
    AND (
      -- Super admins can delete any file (check FIRST)
      EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
      )
      OR
      -- File owners can delete their files
      owner = auth.uid()
    )
  );

-- Create fixed library resource policies with super admin priority
CREATE POLICY "Library resources - view access"
  ON public.library_resources FOR SELECT
  USING (
    -- Super admins can view all resources (check FIRST)
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
    )
    OR
    -- Branch admins can view resources in their associated branches
    (
      EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role = 'branch_admin'
      )
      AND EXISTS (
        SELECT 1 FROM public.admin_branches ab
        WHERE ab.admin_id = auth.uid() 
        AND ab.branch_id = branch_id
      )
    )
    OR
    -- Staff/carers can view resources in their assigned branch (respecting privacy)
    (
      EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role = 'carer'
      )
      AND EXISTS (
        SELECT 1 FROM public.staff s
        WHERE s.id = auth.uid() 
        AND s.branch_id = branch_id
      )
      AND (
        NOT is_private 
        OR access_roles && ARRAY(
          SELECT ur.role::text FROM public.user_roles ur WHERE ur.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Library resources - create access"
  ON public.library_resources FOR INSERT
  WITH CHECK (
    -- Super admins can create resources in any branch (check FIRST)
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
    )
    OR
    -- Branch admins can create resources in their associated branches
    (
      EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role = 'branch_admin'
      )
      AND EXISTS (
        SELECT 1 FROM public.admin_branches ab
        WHERE ab.admin_id = auth.uid() 
        AND ab.branch_id = branch_id
      )
    )
    OR
    -- Staff/carers can create resources in their assigned branch
    (
      EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role = 'carer'
      )
      AND EXISTS (
        SELECT 1 FROM public.staff s
        WHERE s.id = auth.uid() 
        AND s.branch_id = branch_id
      )
    )
  );

CREATE POLICY "Library resources - update access"
  ON public.library_resources FOR UPDATE
  USING (
    -- Super admins can update any resource (check FIRST)
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
    )
    OR
    -- Resource owners can update their resources
    uploaded_by = auth.uid()
    OR
    -- Branch admins can update resources in their branches
    (
      EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role = 'branch_admin'
      )
      AND EXISTS (
        SELECT 1 FROM public.admin_branches ab
        WHERE ab.admin_id = auth.uid() 
        AND ab.branch_id = branch_id
      )
    )
  );

CREATE POLICY "Library resources - delete access"
  ON public.library_resources FOR DELETE
  USING (
    -- Super admins can delete any resource (check FIRST)
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
    )
    OR
    -- Resource owners can delete their resources
    uploaded_by = auth.uid()
    OR
    -- Branch admins can delete resources in their branches
    (
      EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role = 'branch_admin'
      )
      AND EXISTS (
        SELECT 1 FROM public.admin_branches ab
        WHERE ab.admin_id = auth.uid() 
        AND ab.branch_id = branch_id
      )
    )
  );
