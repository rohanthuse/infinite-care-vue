-- Add columns to track proxy submissions
ALTER TABLE form_submissions 
ADD COLUMN IF NOT EXISTS submitted_on_behalf_of uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS submitted_by_admin uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS submission_type text DEFAULT 'self_submitted' 
  CHECK (submission_type IN ('self_submitted', 'admin_on_behalf'));

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can submit forms on behalf of staff in their branch" ON form_submissions;

-- Add RLS policy for admin proxy submissions
CREATE POLICY "Admins can submit forms on behalf of staff in their branch"
ON form_submissions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM get_user_highest_role(auth.uid())
    WHERE role IN ('super_admin', 'branch_admin')
  )
  AND
  (
    EXISTS (
      SELECT 1 FROM get_user_highest_role(auth.uid())
      WHERE role = 'super_admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM admin_branches ab
      WHERE ab.admin_id = auth.uid()
      AND ab.branch_id = form_submissions.branch_id
    )
  )
);

-- Add comments for documentation
COMMENT ON COLUMN form_submissions.submitted_on_behalf_of IS 'Staff member auth_user_id for whom this form was submitted (NULL if self-submitted)';
COMMENT ON COLUMN form_submissions.submitted_by_admin IS 'Admin auth_user_id who submitted on behalf (NULL if self-submitted)';
COMMENT ON COLUMN form_submissions.submission_type IS 'Indicates if submission was self-submitted or done by admin on behalf';