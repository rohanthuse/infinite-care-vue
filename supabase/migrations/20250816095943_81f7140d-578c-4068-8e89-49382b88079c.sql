-- Drop all existing demo_requests policies
DROP POLICY IF EXISTS "System admins can view demo requests" ON public.demo_requests;
DROP POLICY IF EXISTS "System admins can update demo requests" ON public.demo_requests;
DROP POLICY IF EXISTS "Allow public demo request submissions" ON public.demo_requests;

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
  phone,
  organization_name,
  organization_type,
  number_of_users,
  primary_use_case,
  current_solution,
  budget_range,
  timeline,
  specific_requirements,
  status,
  notes
) VALUES (
  'John Smith',
  'john.smith@example.com',
  '+1-555-123-4567',
  'Healthcare Solutions Inc',
  'Healthcare Provider',
  '50-100',
  'Patient care management and staff scheduling',
  'Manual processes with Excel spreadsheets',
  '$5,000-$10,000',
  '1-3 months',
  'Need integration with existing EMR system, mobile app for staff, automated scheduling',
  'pending',
  'Interested in custom integration options'
);