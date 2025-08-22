-- Update RLS policies for library_resources to prevent deletions from non-admins
-- Only allow deletions by super_admin or branch_admin users

-- First, check current policies for library_resources
DROP POLICY IF EXISTS "Users can delete library resources" ON library_resources;

-- Create a new policy that only allows admins to delete library resources
CREATE POLICY "Only admins can delete library resources" 
  ON library_resources 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('super_admin', 'branch_admin')
    )
  );