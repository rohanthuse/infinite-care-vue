-- Add funding type and authority tracking to clients table
ALTER TABLE public.clients 
ADD COLUMN funding_type TEXT DEFAULT 'private' CHECK (funding_type IN ('private', 'authority')),
ADD COLUMN authority_id UUID REFERENCES public.organizations(id);

-- Create funding periods table for date-bounded funding changes
CREATE TABLE public.client_funding_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  funding_type TEXT NOT NULL CHECK (funding_type IN ('private', 'authority')),
  authority_id UUID REFERENCES public.organizations(id),
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Ensure authority_id is provided when funding_type is 'authority'
  CONSTRAINT funding_authority_check CHECK (
    (funding_type = 'authority' AND authority_id IS NOT NULL) OR 
    (funding_type = 'private' AND authority_id IS NULL)
  )
);

-- Create unique index to prevent overlapping periods (alternative to EXCLUDE constraint)
CREATE UNIQUE INDEX client_funding_periods_no_overlap_idx 
ON public.client_funding_periods (client_id, start_date, COALESCE(end_date, '9999-12-31'::date));

-- Add bill-to information to client_billing table
ALTER TABLE public.client_billing
ADD COLUMN bill_to_type TEXT DEFAULT 'private' CHECK (bill_to_type IN ('authority', 'private')),
ADD COLUMN authority_id UUID REFERENCES public.organizations(id),
ADD COLUMN consolidation_type TEXT CHECK (consolidation_type IN ('single', 'split_by_client')),
ADD COLUMN bill_to_address JSONB,
ADD COLUMN service_to_address JSONB;

-- Enable RLS on new table
ALTER TABLE public.client_funding_periods ENABLE ROW LEVEL SECURITY;

-- RLS policies for client_funding_periods
CREATE POLICY "Organization members can manage funding periods" 
ON public.client_funding_periods 
FOR ALL 
USING (
  client_id IN (
    SELECT c.id FROM clients c 
    JOIN branches b ON c.branch_id = b.id 
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  )
)
WITH CHECK (
  client_id IN (
    SELECT c.id FROM clients c 
    JOIN branches b ON c.branch_id = b.id 
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  )
);

-- Function to get active funding type for a client on a specific date
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

-- Function to validate funding period constraints
CREATE OR REPLACE FUNCTION public.validate_client_funding_period()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger for funding period validation
CREATE TRIGGER validate_funding_period_trigger
  BEFORE INSERT OR UPDATE ON public.client_funding_periods
  FOR EACH ROW EXECUTE FUNCTION validate_client_funding_period();

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_funding_periods_updated_at
  BEFORE UPDATE ON public.client_funding_periods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill existing clients with default funding periods
INSERT INTO public.client_funding_periods (client_id, funding_type, authority_id, start_date, created_by)
SELECT 
  id as client_id,
  COALESCE(funding_type, 'private') as funding_type,
  authority_id,
  CURRENT_DATE - INTERVAL '1 year' as start_date, -- Start from a year ago
  (SELECT id FROM auth.users LIMIT 1) as created_by -- Use first available user
FROM public.clients
WHERE NOT EXISTS (
  SELECT 1 FROM public.client_funding_periods cfp 
  WHERE cfp.client_id = clients.id
);

-- Add constraint to ensure client funding_type matches authority_id
ALTER TABLE public.clients
ADD CONSTRAINT client_funding_authority_check CHECK (
  (funding_type = 'authority' AND authority_id IS NOT NULL) OR 
  (funding_type = 'private' AND authority_id IS NULL)
);

-- Update existing clients to have consistent funding_type and authority_id
UPDATE public.clients 
SET funding_type = CASE 
  WHEN authority_id IS NOT NULL THEN 'authority'
  ELSE 'private'
END
WHERE funding_type IS NULL;