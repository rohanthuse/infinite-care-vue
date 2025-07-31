-- Fix RLS policies for payment_records to allow clients to record payments

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can insert payment records" ON payment_records;
DROP POLICY IF EXISTS "Users can update payment records" ON payment_records;
DROP POLICY IF EXISTS "Users can delete payment records" ON payment_records;

-- Create new policy to allow clients to insert payment records for their own invoices
CREATE POLICY "Clients can insert payment records for their invoices" 
ON payment_records FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM client_billing cb
    JOIN clients c ON cb.client_id = c.id
    WHERE cb.id = payment_records.invoice_id 
    AND c.auth_user_id = auth.uid()
  )
);

-- Create new policy to allow clients to view their own payment records
CREATE POLICY "Clients can view their own payment records" 
ON payment_records FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM client_billing cb
    JOIN clients c ON cb.client_id = c.id
    WHERE cb.id = payment_records.invoice_id 
    AND c.auth_user_id = auth.uid()
  )
);

-- Allow admins to insert payment records (for admin functionality)
CREATE POLICY "Admins can insert payment records" 
ON payment_records FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  EXISTS (
    SELECT 1 FROM admin_branches ab
    JOIN clients c ON c.branch_id = ab.branch_id
    JOIN client_billing cb ON cb.client_id = c.id
    WHERE cb.id = payment_records.invoice_id 
    AND ab.admin_id = auth.uid()
  )
);

-- Allow admins to update payment records
CREATE POLICY "Admins can update payment records" 
ON payment_records FOR UPDATE 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  EXISTS (
    SELECT 1 FROM admin_branches ab
    JOIN clients c ON c.branch_id = ab.branch_id
    JOIN client_billing cb ON cb.client_id = c.id
    WHERE cb.id = payment_records.invoice_id 
    AND ab.admin_id = auth.uid()
  )
);

-- Allow admins to delete payment records  
CREATE POLICY "Admins can delete payment records" 
ON payment_records FOR DELETE 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  EXISTS (
    SELECT 1 FROM admin_branches ab
    JOIN clients c ON c.branch_id = ab.branch_id
    JOIN client_billing cb ON cb.client_id = c.id
    WHERE cb.id = payment_records.invoice_id 
    AND ab.admin_id = auth.uid()
  )
);