
-- Create RLS policies for client_medications table to allow INSERT, UPDATE, and DELETE operations

-- Policy for INSERT - Allow users to add medications for clients in their branch
CREATE POLICY "Users can insert medications for their branch clients" 
  ON public.client_medications 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.client_care_plans ccp
      JOIN public.clients c ON ccp.client_id = c.id
      JOIN public.admin_branches ab ON c.branch_id = ab.branch_id
      WHERE ccp.id = client_medications.care_plan_id 
      AND ab.admin_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'super_admin')
  );

-- Policy for UPDATE - Allow users to update medications for clients in their branch
CREATE POLICY "Users can update medications for their branch clients" 
  ON public.client_medications 
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_care_plans ccp
      JOIN public.clients c ON ccp.client_id = c.id
      JOIN public.admin_branches ab ON c.branch_id = ab.branch_id
      WHERE ccp.id = client_medications.care_plan_id 
      AND ab.admin_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'super_admin')
  );

-- Policy for DELETE - Allow users to delete medications for clients in their branch
CREATE POLICY "Users can delete medications for their branch clients" 
  ON public.client_medications 
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_care_plans ccp
      JOIN public.clients c ON ccp.client_id = c.id
      JOIN public.admin_branches ab ON c.branch_id = ab.branch_id
      WHERE ccp.id = client_medications.care_plan_id 
      AND ab.admin_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'super_admin')
  );
