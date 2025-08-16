-- Create a function to get demo request stats that bypasses RLS
CREATE OR REPLACE FUNCTION public.get_demo_request_stats()
RETURNS TABLE(
  total_requests INTEGER,
  pending_requests INTEGER,
  last_request_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_requests,
    COUNT(CASE WHEN status = 'pending' THEN 1 END)::INTEGER as pending_requests,
    MAX(created_at) as last_request_date
  FROM public.demo_requests;
END;
$$;

-- Ensure demo_requests table has proper RLS policies for system dashboard
DROP POLICY IF EXISTS "System admins can view all demo requests" ON public.demo_requests;

CREATE POLICY "System admins can view all demo requests" 
ON public.demo_requests 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'app_admin')
  )
);

-- Also allow public access for the landing page demo form
DROP POLICY IF EXISTS "Allow public demo request submission" ON public.demo_requests;

CREATE POLICY "Allow public demo request submission" 
ON public.demo_requests 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);