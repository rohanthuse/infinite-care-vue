-- Create helper function to get current user's branch IDs
CREATE OR REPLACE FUNCTION public.current_user_branch_ids()
RETURNS TABLE(branch_id uuid)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  -- Get branch IDs from staff table (using auth_user_id)
  SELECT s.branch_id
  FROM public.staff s
  WHERE s.auth_user_id = auth.uid()
  
  UNION
  
  -- Get branch IDs from admin_branches table
  SELECT ab.branch_id
  FROM public.admin_branches ab
  WHERE ab.admin_id = auth.uid();
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Branch staff can insert news2 patients" ON public.news2_patients;
DROP POLICY IF EXISTS "Branch staff can update news2 patients" ON public.news2_patients;
DROP POLICY IF EXISTS "Branch staff can select news2 patients" ON public.news2_patients;
DROP POLICY IF EXISTS "Branch staff can view news2 patients" ON public.news2_patients;

-- Create new policies using the helper function
CREATE POLICY "Branch staff can insert news2 patients"
ON public.news2_patients
FOR INSERT
WITH CHECK (
  branch_id IN (SELECT current_user_branch_ids())
);

CREATE POLICY "Branch staff can update news2 patients"
ON public.news2_patients
FOR UPDATE
USING (
  branch_id IN (SELECT current_user_branch_ids())
);

CREATE POLICY "Branch staff can select news2 patients"
ON public.news2_patients
FOR SELECT
USING (
  branch_id IN (SELECT current_user_branch_ids()) 
  OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'::app_role
  )
);