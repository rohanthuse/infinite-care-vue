-- Fix RLS policy for visit_records to allow staff to manage records correctly
-- Issue: Policy was checking staff.id = auth.uid() instead of staff.auth_user_id = auth.uid()

-- Drop the existing broken policy
DROP POLICY IF EXISTS "Branch staff can manage visit records" ON visit_records;

-- Create the corrected policy with proper auth_user_id check
CREATE POLICY "Branch staff can manage visit records"
ON visit_records
FOR ALL
TO public
USING (
  branch_id IN (
    -- Staff can access visit records in their branch
    SELECT s.branch_id
    FROM staff s
    WHERE s.auth_user_id = auth.uid()  -- FIXED: Changed from s.id to s.auth_user_id
    UNION
    -- Admins can access visit records in their branches
    SELECT ab.branch_id
    FROM admin_branches ab
    WHERE ab.admin_id = auth.uid()
  )
);