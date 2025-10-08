-- Add secure DELETE policy for payroll_records table
-- Only branch admins and super admins can delete payroll records
CREATE POLICY "Branch admins and super admins can delete payroll records"
ON public.payroll_records
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR 
  EXISTS (
    SELECT 1 FROM admin_branches ab
    WHERE ab.branch_id = payroll_records.branch_id 
    AND ab.admin_id = auth.uid()
  )
);