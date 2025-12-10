-- Allow clients to view their own invoices on the client portal
CREATE POLICY "Clients can view their own invoices" 
ON client_billing 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM clients c 
    WHERE c.id = client_billing.client_id 
    AND c.auth_user_id = auth.uid()
  )
);