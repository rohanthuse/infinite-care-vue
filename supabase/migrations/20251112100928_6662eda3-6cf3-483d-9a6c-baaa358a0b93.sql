-- Create security definer functions to optimize RLS policy checks
-- This fixes statement timeout issues when inserting visit tasks and medications

-- Function to check if a user is staff in a specific branch
CREATE OR REPLACE FUNCTION public.is_staff_in_branch(_user_id uuid, _branch_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM staff s
    WHERE s.auth_user_id = _user_id
      AND s.branch_id = _branch_id
  )
$$;

-- Function to check if a user can access a visit record
CREATE OR REPLACE FUNCTION public.can_access_visit_record(_user_id uuid, _visit_record_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM visit_records vr
    WHERE vr.id = _visit_record_id
      AND (
        -- Staff in the same branch
        vr.branch_id IN (
          SELECT s.branch_id
          FROM staff s
          WHERE s.auth_user_id = _user_id
        )
        OR
        -- Admin managing the branch
        vr.branch_id IN (
          SELECT ab.branch_id
          FROM admin_branches ab
          WHERE ab.admin_id = _user_id
        )
      )
  )
$$;

-- Update RLS policy on visit_tasks to use security definer function
DROP POLICY IF EXISTS "Branch staff can manage visit tasks" ON visit_tasks;

CREATE POLICY "Branch staff can manage visit tasks"
ON visit_tasks
FOR ALL
TO public
USING (public.can_access_visit_record(auth.uid(), visit_record_id));

-- Update RLS policy on visit_medications to use security definer function
DROP POLICY IF EXISTS "Branch staff can manage visit medications" ON visit_medications;

CREATE POLICY "Branch staff can manage visit medications"
ON visit_medications
FOR ALL
TO public
USING (public.can_access_visit_record(auth.uid(), visit_record_id));