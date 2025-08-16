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

-- Create RPC function to update demo request status
CREATE OR REPLACE FUNCTION public.update_demo_request_status(
  request_id uuid,
  new_status text,
  new_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.demo_requests 
  SET 
    status = new_status,
    notes = COALESCE(new_notes, notes),
    updated_at = now()
  WHERE id = request_id;
  
  RETURN FOUND;
END;
$$;