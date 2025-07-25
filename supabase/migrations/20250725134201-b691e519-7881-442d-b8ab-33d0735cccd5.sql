-- Update the INSERT policy for documents table to allow super admins
DROP POLICY IF EXISTS "Users can upload documents in their branch" ON documents;

CREATE POLICY "Users can upload documents in their branch" ON documents
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL) AND 
  (
    -- Allow super admins to upload to any branch
    (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')) OR
    -- Keep existing branch restrictions for other users
    (branch_id IN ( 
      SELECT b.id
      FROM ((branches b
        LEFT JOIN admin_branches ab ON ((b.id = ab.branch_id)))
        LEFT JOIN staff s ON ((b.id = s.branch_id)))
      WHERE ((ab.admin_id = auth.uid()) OR (s.id = auth.uid()))
    ))
  )
);