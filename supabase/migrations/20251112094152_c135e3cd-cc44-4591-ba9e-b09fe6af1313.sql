-- Fix RLS policy for client_care_plans to allow carers to view medications
-- Issue: Policy was checking staff.id = auth.uid() instead of staff.auth_user_id = auth.uid()

-- Drop the existing broken policy
DROP POLICY IF EXISTS "Users can view care plans for their branch clients" ON client_care_plans;

-- Create the corrected policy with proper auth_user_id check
CREATE POLICY "Users can view care plans for their branch clients"
ON client_care_plans
FOR SELECT
TO authenticated
USING (
  -- Super admins can view all care plans
  (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'super_admin'::app_role
  ))
  OR
  -- Admins can view care plans for clients in their branches
  (EXISTS (
    SELECT 1
    FROM admin_branches ab
    JOIN clients c ON ab.branch_id = c.branch_id
    WHERE ab.admin_id = auth.uid()
    AND c.id = client_care_plans.client_id
  ))
  OR
  -- Staff/Carers can view care plans for clients in their branch
  -- FIXED: Changed from s.id = auth.uid() to s.auth_user_id = auth.uid()
  (EXISTS (
    SELECT 1
    FROM staff s
    JOIN clients c ON s.branch_id = c.branch_id
    WHERE s.auth_user_id = auth.uid()
    AND c.id = client_care_plans.client_id
  ))
  OR
  -- Clients can view their own care plans
  (EXISTS (
    SELECT 1
    FROM clients c
    WHERE c.auth_user_id = auth.uid()
    AND c.id = client_care_plans.client_id
  ))
);