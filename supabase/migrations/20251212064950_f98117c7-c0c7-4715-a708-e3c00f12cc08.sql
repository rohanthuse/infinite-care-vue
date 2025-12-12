-- Fix RLS policy for staff table updates
-- The issue is that 'id = auth.uid()' compares staff.id to auth user id
-- but staff.id is NOT the same as auth.uid(). We need auth_user_id = auth.uid()

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Admins can update staff" ON public.staff;
DROP POLICY IF EXISTS "Staff can update own profile" ON public.staff;

-- Create a proper policy for admins to update staff
CREATE POLICY "Admins can update staff"
ON public.staff
FOR UPDATE
USING (
  -- Super admins can update any staff
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR 
  -- Branch admins can update staff in their branch
  (has_role(auth.uid(), 'branch_admin'::app_role) AND 
   EXISTS (
     SELECT 1 FROM public.admin_branches ab 
     WHERE ab.branch_id = staff.branch_id AND ab.admin_id = auth.uid()
   ))
  OR
  -- Staff can update their own profile (using auth_user_id, not id)
  (auth_user_id = auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR 
  (has_role(auth.uid(), 'branch_admin'::app_role) AND 
   EXISTS (
     SELECT 1 FROM public.admin_branches ab 
     WHERE ab.branch_id = staff.branch_id AND ab.admin_id = auth.uid()
   ))
  OR
  (auth_user_id = auth.uid())
);