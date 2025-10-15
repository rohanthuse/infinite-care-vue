-- Create client_vaccinations table
CREATE TABLE IF NOT EXISTS public.client_vaccinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  vaccination_name TEXT NOT NULL,
  vaccination_date DATE NOT NULL,
  next_due_date DATE,
  interval_months INTEGER,
  file_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  branch_id UUID REFERENCES public.branches(id),
  organization_id UUID REFERENCES public.organizations(id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_vaccinations_client_id ON public.client_vaccinations(client_id);
CREATE INDEX IF NOT EXISTS idx_client_vaccinations_branch_id ON public.client_vaccinations(branch_id);
CREATE INDEX IF NOT EXISTS idx_client_vaccinations_next_due_date ON public.client_vaccinations(next_due_date);

-- Enable RLS
ALTER TABLE public.client_vaccinations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can manage all vaccination records in their branch
CREATE POLICY "Admins can manage vaccination records"
ON public.client_vaccinations
FOR ALL
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.admin_branches ab
    JOIN public.clients c ON c.branch_id = ab.branch_id
    WHERE ab.admin_id = auth.uid()
    AND c.id = client_vaccinations.client_id
  )
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.admin_branches ab
    JOIN public.clients c ON c.branch_id = ab.branch_id
    WHERE ab.admin_id = auth.uid()
    AND c.id = client_vaccinations.client_id
  )
);

-- RLS Policy: Clients can view their own vaccination records
CREATE POLICY "Clients can view own vaccination records"
ON public.client_vaccinations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = client_vaccinations.client_id
    AND c.auth_user_id = auth.uid()
  )
);

-- RLS Policy: Staff can view vaccination records for clients in their branch
CREATE POLICY "Staff can view vaccination records in their branch"
ON public.client_vaccinations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.staff s
    JOIN public.clients c ON c.branch_id = s.branch_id
    WHERE s.auth_user_id = auth.uid()
    AND c.id = client_vaccinations.client_id
  )
);

-- Trigger to auto-set branch_id and organization_id
CREATE OR REPLACE FUNCTION public.set_vaccination_branch_and_org()
RETURNS TRIGGER AS $$
BEGIN
  SELECT c.branch_id, b.organization_id
  INTO NEW.branch_id, NEW.organization_id
  FROM public.clients c
  JOIN public.branches b ON c.branch_id = b.id
  WHERE c.id = NEW.client_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_vaccination_branch_org_trigger
  BEFORE INSERT ON public.client_vaccinations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_vaccination_branch_and_org();

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_client_vaccinations_updated_at
  BEFORE UPDATE ON public.client_vaccinations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();