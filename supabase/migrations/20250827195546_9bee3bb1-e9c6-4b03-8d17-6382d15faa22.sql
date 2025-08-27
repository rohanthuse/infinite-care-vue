-- Fix staff training records access issue by ensuring proper auth_user_id linking
-- and adding unique constraint to prevent duplicate assignments

-- First, let's fix any staff records that have missing auth_user_id but should have them
-- This will link staff records to their auth users based on email matching
UPDATE public.staff 
SET auth_user_id = au.id
FROM auth.users au
WHERE public.staff.email = au.email 
AND public.staff.auth_user_id IS NULL
AND au.id IS NOT NULL;

-- Add unique constraint to staff_training_records to prevent duplicate assignments
-- This will ensure upsert works correctly when assigning training
ALTER TABLE public.staff_training_records 
ADD CONSTRAINT unique_staff_training_course 
UNIQUE (staff_id, training_course_id);

-- Improve RLS policy for staff_training_records to handle the auth properly
-- Drop the existing policy that might be causing issues
DROP POLICY IF EXISTS "Staff can view their own training records" ON public.staff_training_records;

-- Create a new, more robust policy for staff to view their own training records
CREATE POLICY "Carers can view their own training records" 
ON public.staff_training_records 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = staff_training_records.staff_id 
    AND s.auth_user_id = auth.uid()
  )
);

-- Also ensure carers can update their own training progress
DROP POLICY IF EXISTS "Staff can update their own training records" ON public.staff_training_records;

CREATE POLICY "Carers can update their own training progress" 
ON public.staff_training_records 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = staff_training_records.staff_id 
    AND s.auth_user_id = auth.uid()
  )
);

-- Ensure training_courses are visible to staff in the same branch
DROP POLICY IF EXISTS "Users can view training courses in their branches" ON public.training_courses;

CREATE POLICY "Staff can view training courses in their branch" 
ON public.training_courses 
FOR SELECT 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  EXISTS (
    SELECT 1 FROM admin_branches ab
    WHERE ab.branch_id = training_courses.branch_id 
    AND ab.admin_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM staff s
    WHERE s.auth_user_id = auth.uid() 
    AND s.branch_id = training_courses.branch_id
  )
);