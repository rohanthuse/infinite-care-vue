-- Add RLS policy to allow clients to update their own invoices when making payments
CREATE POLICY "Clients can update their own invoice status for payments" 
ON client_billing FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM clients c
    WHERE c.id = client_billing.client_id 
    AND c.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM clients c
    WHERE c.id = client_billing.client_id 
    AND c.auth_user_id = auth.uid()
  )
);