-- Add system admin user to user_roles table if not exists
INSERT INTO public.user_roles (user_id, role) 
VALUES ('ada38822-6d93-46c2-9ee5-b360e62fc5f4', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Create RPC function to get demo requests that bypasses RLS for system admins
CREATE OR REPLACE FUNCTION public.get_demo_requests()
RETURNS TABLE(
  id uuid,
  full_name text,
  email text,
  company_name text,
  phone text,
  message text,
  status text,
  notes text,
  submitted_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dr.id,
    dr.full_name,
    dr.email,
    dr.company_name,
    dr.phone,
    dr.message,
    dr.status,
    dr.notes,
    dr.submitted_at,
    dr.created_at,
    dr.updated_at
  FROM public.demo_requests dr
  ORDER BY dr.created_at DESC;
END;
$$;