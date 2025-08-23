
-- Fix RLS for staff_leave_requests to align with staff.auth_user_id linkage

-- Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public.staff_leave_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Staff can create their own leave requests" ON public.staff_leave_requests;
DROP POLICY IF EXISTS "Staff can update their pending leave requests" ON public.staff_leave_requests;
DROP POLICY IF EXISTS "Staff can view their own leave requests" ON public.staff_leave_requests;

-- Recreate policies using staff.auth_user_id = auth.uid()

-- Carers can create their own leave requests (must be their staff record and matching branch)
CREATE POLICY "Staff can create their own leave requests"
ON public.staff_leave_requests
FOR INSERT
TO authenticated
WITH CHECK (
  -- Verify the staff_id belongs to the current authenticated user
  EXISTS (
    SELECT 1
    FROM public.staff s
    WHERE s.id = staff_leave_requests.staff_id
      AND s.auth_user_id = auth.uid()
      AND s.branch_id = staff_leave_requests.branch_id
  )
);

-- Carers can view their own leave requests; admins can view for their branches; super_admin can view all
CREATE POLICY "Staff can view their own leave requests"
ON public.staff_leave_requests
FOR SELECT
TO authenticated
USING (
  -- Carer (current user) viewing their own requests
  EXISTS (
    SELECT 1
    FROM public.staff s
    WHERE s.id = staff_leave_requests.staff_id
      AND s.auth_user_id = auth.uid()
  )
  OR
  -- Branch admins can view leave requests in their branches
  EXISTS (
    SELECT 1
    FROM public.admin_branches ab
    WHERE ab.branch_id = staff_leave_requests.branch_id
      AND ab.admin_id = auth.uid()
  )
  OR
  -- Super admin can view all
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'super_admin'
  )
);

-- Carers can update their own pending requests; admins and super_admin can update too
CREATE POLICY "Staff can update their pending leave requests"
ON public.staff_leave_requests
FOR UPDATE
TO authenticated
USING (
  (
    -- Carer can update only their own pending requests
    status = 'pending'
    AND EXISTS (
      SELECT 1
      FROM public.staff s
      WHERE s.id = staff_leave_requests.staff_id
        AND s.auth_user_id = auth.uid()
    )
  )
  OR
  -- Branch admins can update requests in their branches
  EXISTS (
    SELECT 1
    FROM public.admin_branches ab
    WHERE ab.branch_id = staff_leave_requests.branch_id
      AND ab.admin_id = auth.uid()
  )
  OR
  -- Super admin can update all
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'super_admin'
  )
);
