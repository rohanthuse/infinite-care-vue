-- Add RLS policy for staff_documents to allow branch admins to read documents for staff in their branches
CREATE POLICY "Branch admins can view staff documents" ON public.staff_documents
  FOR SELECT USING (
    staff_id IN (
      SELECT s.id 
      FROM staff s
      JOIN admin_branches ab ON s.branch_id = ab.branch_id
      WHERE ab.admin_id = auth.uid()
    )
  );