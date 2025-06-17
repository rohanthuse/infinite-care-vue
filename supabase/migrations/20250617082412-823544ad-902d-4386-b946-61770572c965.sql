
-- Add only the missing RLS policies for client_billing table
CREATE POLICY "Users can insert invoices" ON public.client_billing
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update invoices" ON public.client_billing
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete invoices" ON public.client_billing
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);
