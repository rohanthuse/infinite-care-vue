-- Create system admin check function
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has super_admin role OR is authenticated via system auth context
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) OR auth.jwt() ->> 'email' = 'admin@system.local';
END;
$$;

-- Allow public to insert demo requests (for the public form)
CREATE POLICY "Allow public demo request submissions" 
ON public.demo_requests 
FOR INSERT 
WITH CHECK (true);

-- Allow system admins and super admins to view all demo requests
CREATE POLICY "System admins can view demo requests" 
ON public.demo_requests 
FOR SELECT 
USING (
  is_system_admin() OR 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'app_admin')
  )
);

-- Allow system admins and super admins to update demo requests
CREATE POLICY "System admins can update demo requests" 
ON public.demo_requests 
FOR UPDATE 
USING (
  is_system_admin() OR 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'app_admin')
  )
);

-- Insert a test demo request to verify the system works
INSERT INTO public.demo_requests (
  full_name,
  email,
  phone_number,
  organization_name,
  message,
  status,
  notes
) VALUES (
  'John Smith',
  'john.smith@example.com',
  '+1-555-123-4567',
  'Healthcare Solutions Inc',
  'We are interested in implementing your care management system for our healthcare organization.',
  'pending',
  'Interested in custom integration options'
);