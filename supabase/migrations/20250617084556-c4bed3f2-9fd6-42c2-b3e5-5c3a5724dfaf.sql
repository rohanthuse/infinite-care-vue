
-- Drop the problematic policy that tries to access auth.users table directly
DROP POLICY IF EXISTS "Clients can view their own invoices" ON public.client_billing;

-- Create a more appropriate policy that allows clients to view invoices through proper channels
-- Since we don't have a direct client authentication system, we'll focus on admin access for now
-- and can add client access later when we have proper client authentication set up

-- Update the existing admin policies to be more specific and avoid conflicts
DROP POLICY IF EXISTS "Admins can view invoices for their branch clients" ON public.client_billing;

-- Recreate the admin view policy with better naming
CREATE POLICY "Branch admins can view client invoices" ON public.client_billing
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

-- Also update the line items and payment records policies to be consistent
DROP POLICY IF EXISTS "Users can view invoice line items" ON public.invoice_line_items;
DROP POLICY IF EXISTS "Users can view payment records" ON public.payment_records;

-- Create proper admin-only policies for line items
CREATE POLICY "Branch admins can view invoice line items" ON public.invoice_line_items
  FOR SELECT 
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    EXISTS (
      SELECT 1 FROM public.admin_branches ab
      JOIN public.clients c ON c.branch_id = ab.branch_id
      JOIN public.client_billing cb ON cb.client_id = c.id
      WHERE ab.admin_id = auth.uid() 
      AND cb.id = invoice_line_items.invoice_id
    )
  );

-- Create proper admin-only policies for payment records
CREATE POLICY "Branch admins can view payment records" ON public.payment_records
  FOR SELECT 
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    EXISTS (
      SELECT 1 FROM public.admin_branches ab
      JOIN public.clients c ON c.branch_id = ab.branch_id
      JOIN public.client_billing cb ON cb.client_id = c.id
      WHERE ab.admin_id = auth.uid() 
      AND cb.id = payment_records.invoice_id
    )
  );
