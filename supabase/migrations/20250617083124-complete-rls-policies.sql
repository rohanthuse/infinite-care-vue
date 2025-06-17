
-- Enable RLS on invoice_line_items if not already enabled
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

-- Enable RLS on payment_records if not already enabled  
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- Create INSERT policy for invoice_line_items
CREATE POLICY "Branch admins can insert invoice line items" ON public.invoice_line_items
  FOR INSERT 
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin') OR
    EXISTS (
      SELECT 1 FROM public.admin_branches ab
      JOIN public.clients c ON c.branch_id = ab.branch_id
      JOIN public.client_billing cb ON cb.client_id = c.id
      WHERE ab.admin_id = auth.uid() 
      AND cb.id = invoice_line_items.invoice_id
    )
  );

-- Create UPDATE policy for invoice_line_items
CREATE POLICY "Branch admins can update invoice line items" ON public.invoice_line_items
  FOR UPDATE 
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

-- Create DELETE policy for invoice_line_items
CREATE POLICY "Branch admins can delete invoice line items" ON public.invoice_line_items
  FOR DELETE 
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

-- Create INSERT policy for payment_records
CREATE POLICY "Branch admins can insert payment records" ON public.payment_records
  FOR INSERT 
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin') OR
    EXISTS (
      SELECT 1 FROM public.admin_branches ab
      JOIN public.clients c ON c.branch_id = ab.branch_id
      JOIN public.client_billing cb ON cb.client_id = c.id
      WHERE ab.admin_id = auth.uid() 
      AND cb.id = payment_records.invoice_id
    )
  );

-- Create UPDATE policy for payment_records
CREATE POLICY "Branch admins can update payment records" ON public.payment_records
  FOR UPDATE 
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

-- Create DELETE policy for payment_records
CREATE POLICY "Branch admins can delete payment records" ON public.payment_records
  FOR DELETE 
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
