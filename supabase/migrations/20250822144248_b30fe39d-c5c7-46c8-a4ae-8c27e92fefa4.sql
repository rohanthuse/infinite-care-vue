-- Update library_resources RLS policies to allow carers and clients access

-- Drop existing policies to replace them
DROP POLICY IF EXISTS "Branch admins can manage library resources" ON public.library_resources;
DROP POLICY IF EXISTS "Organization members can manage library resources" ON public.library_resources;

-- Create comprehensive policies for library resources
CREATE POLICY "Branch admins can manage library resources" 
ON public.library_resources 
FOR ALL
USING (
  branch_id IN (
    SELECT ab.branch_id 
    FROM admin_branches ab 
    WHERE ab.admin_id = auth.uid()
  )
)
WITH CHECK (
  branch_id IN (
    SELECT ab.branch_id 
    FROM admin_branches ab 
    WHERE ab.admin_id = auth.uid()
  )
);

-- Allow carers to view resources in their branch
CREATE POLICY "Carers can view library resources" 
ON public.library_resources 
FOR SELECT
USING (
  branch_id IN (
    SELECT s.branch_id 
    FROM staff s 
    WHERE s.auth_user_id = auth.uid()
  ) AND (
    is_private = false OR 
    (is_private = true AND 'Carer' = ANY(access_roles))
  )
);

-- Allow clients to view resources in their branch
CREATE POLICY "Clients can view library resources" 
ON public.library_resources 
FOR SELECT
USING (
  branch_id IN (
    SELECT c.branch_id 
    FROM clients c 
    WHERE c.auth_user_id = auth.uid()
  ) AND (
    is_private = false OR 
    (is_private = true AND 'Client' = ANY(access_roles))
  )
);

-- Update storage policies for library-resources bucket to allow carers and clients to download
CREATE POLICY "Carers can download library resources"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'library-resources' AND
  EXISTS (
    SELECT 1 FROM public.library_resources lr
    JOIN staff s ON s.branch_id = lr.branch_id
    WHERE s.auth_user_id = auth.uid()
    AND lr.file_path = name
    AND (lr.is_private = false OR (lr.is_private = true AND 'Carer' = ANY(lr.access_roles)))
  )
);

CREATE POLICY "Clients can download library resources"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'library-resources' AND
  EXISTS (
    SELECT 1 FROM public.library_resources lr
    JOIN clients c ON c.branch_id = lr.branch_id
    WHERE c.auth_user_id = auth.uid()
    AND lr.file_path = name
    AND (lr.is_private = false OR (lr.is_private = true AND 'Client' = ANY(lr.access_roles)))
  )
);