-- Fix security issues by setting search_path for the functions we just created
CREATE OR REPLACE FUNCTION public.get_client_funding_info(
  p_client_id UUID, 
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  funding_type TEXT,
  authority_id UUID,
  authority_name TEXT
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cfp.funding_type,
    cfp.authority_id,
    o.name as authority_name
  FROM public.client_funding_periods cfp
  LEFT JOIN public.organizations o ON cfp.authority_id = o.id
  WHERE cfp.client_id = p_client_id
    AND cfp.start_date <= p_date
    AND (cfp.end_date IS NULL OR cfp.end_date >= p_date)
  ORDER BY cfp.start_date DESC
  LIMIT 1;
  
  -- If no funding period found, use client's default funding_type
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      c.funding_type,
      c.authority_id,
      o.name as authority_name
    FROM public.clients c
    LEFT JOIN public.organizations o ON c.authority_id = o.id
    WHERE c.id = p_client_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_client_funding_period()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Ensure authority_id matches funding_type
  IF NEW.funding_type = 'authority' AND NEW.authority_id IS NULL THEN
    RAISE EXCEPTION 'Authority ID is required when funding type is authority';
  END IF;
  
  IF NEW.funding_type = 'private' AND NEW.authority_id IS NOT NULL THEN
    RAISE EXCEPTION 'Authority ID must be null when funding type is private';
  END IF;
  
  -- Ensure end_date is after start_date
  IF NEW.end_date IS NOT NULL AND NEW.end_date <= NEW.start_date THEN
    RAISE EXCEPTION 'End date must be after start date';
  END IF;
  
  -- Check for overlapping periods
  IF EXISTS (
    SELECT 1 FROM public.client_funding_periods cfp
    WHERE cfp.client_id = NEW.client_id
      AND cfp.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND cfp.start_date <= COALESCE(NEW.end_date, '9999-12-31'::date)
      AND COALESCE(cfp.end_date, '9999-12-31'::date) >= NEW.start_date
  ) THEN
    RAISE EXCEPTION 'Funding period overlaps with existing period for this client';
  END IF;
  
  RETURN NEW;
END;
$$;