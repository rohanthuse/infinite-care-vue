-- Create client_addresses table for multiple address support
CREATE TABLE public.client_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  address_label TEXT DEFAULT 'Home',
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state_county TEXT,
  postcode TEXT NOT NULL,
  country TEXT DEFAULT 'United Kingdom',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX idx_client_addresses_client_id ON public.client_addresses(client_id);
CREATE INDEX idx_client_addresses_default ON public.client_addresses(client_id, is_default) WHERE is_default = true;

-- Trigger function to ensure only one default address per client
CREATE OR REPLACE FUNCTION public.ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Clear default flag on other addresses for this client
    UPDATE public.client_addresses 
    SET is_default = false, updated_at = now()
    WHERE client_id = NEW.client_id AND id != NEW.id AND is_default = true;
  END IF;
  
  -- If this is the first/only address, make it default
  IF NEW.is_default = false AND NOT EXISTS (
    SELECT 1 FROM public.client_addresses 
    WHERE client_id = NEW.client_id AND id != NEW.id
  ) THEN
    NEW.is_default = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_ensure_single_default_address
BEFORE INSERT OR UPDATE ON public.client_addresses
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_default_address();

-- Trigger for updated_at
CREATE TRIGGER update_client_addresses_updated_at
BEFORE UPDATE ON public.client_addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.client_addresses ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view addresses for clients in their branch
CREATE POLICY "Users can view client addresses in their branch"
ON public.client_addresses FOR SELECT
USING (
  client_id IN (
    SELECT c.id FROM public.clients c
    WHERE c.branch_id IN (
      SELECT ab.branch_id FROM public.admin_branches ab WHERE ab.admin_id = auth.uid()
      UNION
      SELECT s.branch_id FROM public.staff s WHERE s.auth_user_id = auth.uid()
    )
  )
  OR
  client_id IN (
    SELECT c.id FROM public.clients c WHERE c.auth_user_id = auth.uid()
  )
);

-- RLS Policy: Users can manage addresses for clients in their branch
CREATE POLICY "Users can manage client addresses in their branch"
ON public.client_addresses FOR ALL
USING (
  client_id IN (
    SELECT c.id FROM public.clients c
    WHERE c.branch_id IN (
      SELECT ab.branch_id FROM public.admin_branches ab WHERE ab.admin_id = auth.uid()
      UNION
      SELECT s.branch_id FROM public.staff s WHERE s.auth_user_id = auth.uid()
    )
  )
  OR
  client_id IN (
    SELECT c.id FROM public.clients c WHERE c.auth_user_id = auth.uid()
  )
);