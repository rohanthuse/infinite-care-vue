-- Add DELETE policies for clients table

-- Policy 1: Allow admins to delete clients in their branches
CREATE POLICY "Admins can delete clients in their branches"
ON public.clients
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND EXISTS (
    SELECT 1 
    FROM admin_branches ab 
    WHERE ab.branch_id = clients.branch_id 
      AND ab.admin_id = auth.uid()
  )
);

-- Policy 2: Allow super admins to delete any client
CREATE POLICY "Super admins can delete any client"
ON public.clients
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));