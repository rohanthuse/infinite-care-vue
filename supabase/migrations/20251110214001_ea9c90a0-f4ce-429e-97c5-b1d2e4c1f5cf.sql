-- Add RLS policy to allow admins to delete staff documents
CREATE POLICY "Admins can delete staff documents"
ON staff_documents
FOR DELETE
TO public
USING (
  -- Super admins can delete any staff document
  has_role(auth.uid(), 'super_admin'::app_role)
  OR
  -- Branch admins can delete documents for staff in their branches
  EXISTS (
    SELECT 1 
    FROM staff s
    JOIN admin_branches ab ON s.branch_id = ab.branch_id
    WHERE s.id = staff_documents.staff_id 
    AND ab.admin_id = auth.uid()
  )
);