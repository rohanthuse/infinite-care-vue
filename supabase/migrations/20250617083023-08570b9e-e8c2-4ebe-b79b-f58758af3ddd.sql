
-- Drop the incorrect policies that allow any authenticated user to modify invoices
DROP POLICY IF EXISTS "Users can insert invoices" ON public.client_billing;
DROP POLICY IF EXISTS "Users can update invoices" ON public.client_billing;
DROP POLICY IF EXISTS "Users can delete invoices" ON public.client_billing;

-- Create proper role-based policies for client_billing table

-- Allow admins to create invoices for clients in their branch
CREATE POLICY "Admins can insert invoices for their branch clients" ON public.client_billing
  FOR INSERT 
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin') OR
    EXISTS (
      SELECT 1 FROM public.admin_branches ab
      JOIN public.clients c ON c.branch_id = ab.branch_id
      WHERE ab.admin_id = auth.uid() 
      AND c.id = client_billing.client_id
    )
  );

-- Allow admins to update invoices for clients in their branch
CREATE POLICY "Admins can update invoices for their branch clients" ON public.client_billing
  FOR UPDATE 
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    EXISTS (
      SELECT 1 FROM public.admin_branches ab
      JOIN public.clients c ON c.branch_id = ab.branch_id
      WHERE ab.admin_id = auth.uid() 
      AND c.id = client_billing.client_id
    )
  );

-- Allow admins to delete invoices for clients in their branch
CREATE POLICY "Admins can delete invoices for their branch clients" ON public.client_billing
  FOR DELETE 
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    EXISTS (
      SELECT 1 FROM public.admin_branches ab
      JOIN public.clients c ON c.branch_id = ab.branch_id
      WHERE ab.admin_id = auth.uid() 
      AND c.id = client_billing.client_id
    )
  );

-- Allow admins to view all invoices in their branch
CREATE POLICY "Admins can view invoices for their branch clients" ON public.client_billing
  FOR SELECT 
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    EXISTS (
      SELECT 1 FROM public.admin_branches ab
      JOIN public.clients c ON c.branch_id = ab.branch_id
      WHERE ab.admin_id = auth.uid() 
      AND c.id = client_billing.client_id
    )
  );

-- Allow clients to view only their own invoices (if they have auth access)
CREATE POLICY "Clients can view their own invoices" ON public.client_billing
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_billing.client_id 
      AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
