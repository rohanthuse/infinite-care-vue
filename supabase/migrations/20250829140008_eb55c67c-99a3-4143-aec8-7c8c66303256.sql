
-- Allow super admins to insert clients into any branch
CREATE POLICY "Super admins can insert clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
