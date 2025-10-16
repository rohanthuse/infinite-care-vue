-- Fix RLS policies on documents table to use staff.auth_user_id instead of staff.id

-- Drop existing policies that use incorrect staff.id check
DROP POLICY IF EXISTS "Organization members can manage documents" ON public.documents;

-- Recreate SELECT policy with correct staff check
CREATE POLICY "Organization members can view documents"
ON public.documents
FOR SELECT
USING (
  -- Super admins can view all
  has_role(auth.uid(), 'super_admin'::app_role)
  OR
  -- Branch admins can view documents in their branches
  (branch_id IN (
    SELECT ab.branch_id 
    FROM admin_branches ab 
    WHERE ab.admin_id = auth.uid()
  ))
  OR
  -- Staff can view documents in their branch (using auth_user_id)
  (branch_id IN (
    SELECT s.branch_id 
    FROM staff s 
    WHERE s.auth_user_id = auth.uid()
  ))
  OR
  -- Clients can view their own documents
  (client_id IN (
    SELECT c.id 
    FROM clients c 
    WHERE c.auth_user_id = auth.uid()
  ))
  OR
  -- Staff can view documents assigned to them
  (staff_id IN (
    SELECT s.id 
    FROM staff s 
    WHERE s.auth_user_id = auth.uid()
  ))
);

-- Recreate INSERT policy with correct staff check
CREATE POLICY "Organization members can create documents"
ON public.documents
FOR INSERT
WITH CHECK (
  -- Super admins can create documents
  has_role(auth.uid(), 'super_admin'::app_role)
  OR
  -- Branch admins can create documents in their branches
  (branch_id IN (
    SELECT ab.branch_id 
    FROM admin_branches ab 
    WHERE ab.admin_id = auth.uid()
  ))
  OR
  -- Staff can create documents in their branch (using auth_user_id)
  (branch_id IN (
    SELECT s.branch_id 
    FROM staff s 
    WHERE s.auth_user_id = auth.uid()
  ))
);

-- Recreate UPDATE policy with correct staff check
CREATE POLICY "Organization members can update documents"
ON public.documents
FOR UPDATE
USING (
  -- Super admins can update all
  has_role(auth.uid(), 'super_admin'::app_role)
  OR
  -- Branch admins can update documents in their branches
  (branch_id IN (
    SELECT ab.branch_id 
    FROM admin_branches ab 
    WHERE ab.admin_id = auth.uid()
  ))
  OR
  -- Staff can update documents in their branch (using auth_user_id)
  (branch_id IN (
    SELECT s.branch_id 
    FROM staff s 
    WHERE s.auth_user_id = auth.uid()
  ))
)
WITH CHECK (
  -- Same conditions for the updated row
  has_role(auth.uid(), 'super_admin'::app_role)
  OR
  (branch_id IN (
    SELECT ab.branch_id 
    FROM admin_branches ab 
    WHERE ab.admin_id = auth.uid()
  ))
  OR
  (branch_id IN (
    SELECT s.branch_id 
    FROM staff s 
    WHERE s.auth_user_id = auth.uid()
  ))
);

-- Recreate DELETE policy with correct staff check
CREATE POLICY "Organization members can delete documents"
ON public.documents
FOR DELETE
USING (
  -- Super admins can delete all
  has_role(auth.uid(), 'super_admin'::app_role)
  OR
  -- Branch admins can delete documents in their branches
  (branch_id IN (
    SELECT ab.branch_id 
    FROM admin_branches ab 
    WHERE ab.admin_id = auth.uid()
  ))
  OR
  -- Staff can delete documents in their branch (using auth_user_id)
  (branch_id IN (
    SELECT s.branch_id 
    FROM staff s 
    WHERE s.auth_user_id = auth.uid()
  ))
);