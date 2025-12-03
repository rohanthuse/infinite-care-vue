-- Fix storage RLS policies that incorrectly use s.id instead of s.auth_user_id
-- The s.id is the staff record UUID, but auth.uid() returns the auth user UUID
-- These must be compared via s.auth_user_id = auth.uid()

-- Drop and recreate "Library files - view access" policy with correct comparison
DROP POLICY IF EXISTS "Library files - view access" ON storage.objects;

CREATE POLICY "Library files - view access"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'library-resources'
  AND (
    -- Super admin access
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
    )
    OR
    -- Branch admin access
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
    -- Staff/Carer access (FIXED: use auth_user_id instead of id)
    (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role = 'carer'
      )
      AND EXISTS (
        SELECT 1 FROM public.staff s
        WHERE s.auth_user_id = auth.uid()
        AND s.branch_id::text = (storage.foldername(name))[1]
      )
    )
    OR
    -- Client access
    (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role = 'client'
      )
      AND EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.auth_user_id = auth.uid()
        AND c.branch_id::text = (storage.foldername(name))[1]
      )
    )
  )
);

-- Drop and recreate "Users can view files in their branch" policy with correct comparison
DROP POLICY IF EXISTS "Users can view files in their branch" ON storage.objects;

CREATE POLICY "Users can view files in their branch"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'library-resources'
  AND (storage.foldername(name))[1] IN (
    -- Admin branches
    SELECT ab.branch_id::text FROM public.admin_branches ab WHERE ab.admin_id = auth.uid()
    UNION
    -- Staff branches (FIXED: use auth_user_id)
    SELECT s.branch_id::text FROM public.staff s WHERE s.auth_user_id = auth.uid()
    UNION
    -- Client branches
    SELECT c.branch_id::text FROM public.clients c WHERE c.auth_user_id = auth.uid()
  )
);