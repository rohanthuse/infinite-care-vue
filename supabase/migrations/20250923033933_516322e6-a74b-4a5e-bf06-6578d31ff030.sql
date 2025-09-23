-- Fix security warnings for newly created functions by setting search_path

-- Fix get_organization_id_from_client function
CREATE OR REPLACE FUNCTION public.get_organization_id_from_client(client_id_param uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id uuid;
BEGIN
  SELECT b.organization_id INTO org_id
  FROM public.clients c
  JOIN public.branches b ON c.branch_id = b.id
  WHERE c.id = client_id_param;
  
  RETURN org_id;
END;
$$;

-- Fix set_billing_organization_id function
CREATE OR REPLACE FUNCTION public.set_billing_organization_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := get_organization_id_from_client(NEW.client_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Fix set_line_item_organization_id function
CREATE OR REPLACE FUNCTION public.set_line_item_organization_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.client_billing
    WHERE id = NEW.invoice_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Fix get_uninvoiced_bookings function search path
CREATE OR REPLACE FUNCTION public.get_uninvoiced_bookings(branch_id_param uuid DEFAULT NULL::uuid)
RETURNS TABLE(booking_id uuid, client_id uuid, client_name text, service_title text, start_time timestamp with time zone, end_time timestamp with time zone, revenue numeric, days_since_service integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_org_id uuid;
BEGIN
  -- Get user's organization ID
  user_org_id := get_user_organization_id(auth.uid());
  
  RETURN QUERY
  SELECT 
    b.id as booking_id,
    b.client_id,
    CONCAT(c.first_name, ' ', c.last_name) as client_name,
    s.title as service_title,
    b.start_time,
    b.end_time,
    b.revenue,
    EXTRACT(DAY FROM now() - b.end_time)::INTEGER as days_since_service
  FROM public.bookings b
  LEFT JOIN public.clients c ON b.client_id = c.id
  LEFT JOIN public.services s ON b.service_id = s.id
  LEFT JOIN public.branches br ON b.branch_id = br.id
  LEFT JOIN public.client_billing cb ON cb.booking_id = b.id
  WHERE 
    b.end_time < now() -- Service has been completed
    AND cb.id IS NULL -- No invoice exists for this booking
    AND b.status = 'completed' -- Only completed bookings
    AND br.organization_id = user_org_id -- Organization isolation
    AND (branch_id_param IS NULL OR b.branch_id = branch_id_param)
  ORDER BY b.end_time DESC;
END;
$$;