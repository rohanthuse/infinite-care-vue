
-- Create INSERT policy for clients table
-- Allow authenticated users to insert clients for branches they have access to
CREATE POLICY "Users can insert clients for their branches" 
ON public.clients 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_branches ab 
    WHERE ab.branch_id = clients.branch_id 
    AND ab.admin_id = auth.uid()
  )
);
