-- Create demo_requests table to store demo request submissions
CREATE TABLE public.demo_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  organization_name text,
  email text NOT NULL,
  phone_number text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  contacted_by uuid,
  contacted_at timestamp with time zone,
  notes text
);

-- Enable RLS
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for demo requests
-- Allow public insert (for demo request submissions)
CREATE POLICY "Anyone can submit demo requests" 
ON public.demo_requests 
FOR INSERT 
WITH CHECK (true);

-- Allow system admins to view and manage all demo requests
CREATE POLICY "System admins can view all demo requests" 
ON public.demo_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'app_admin')
  )
);

CREATE POLICY "System admins can update demo requests" 
ON public.demo_requests 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'app_admin')
  )
);

-- Create index for better performance
CREATE INDEX idx_demo_requests_status ON public.demo_requests(status);
CREATE INDEX idx_demo_requests_created_at ON public.demo_requests(created_at DESC);