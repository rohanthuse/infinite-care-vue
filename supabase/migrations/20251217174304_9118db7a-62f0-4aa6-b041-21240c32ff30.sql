-- Create client_authority_accounting table for multiple authority entries per client
CREATE TABLE public.client_authority_accounting (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  authority_id UUID NOT NULL REFERENCES public.authorities(id),
  reference_number TEXT,
  travel_rate_id UUID REFERENCES public.travel_rates(id),
  charge_based_on TEXT DEFAULT 'planned_time' CHECK (charge_based_on IN ('planned_time', 'actual_time')),
  extra_time_calculation BOOLEAN DEFAULT false,
  client_contribution_required BOOLEAN DEFAULT false,
  branch_id UUID REFERENCES public.branches(id),
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.client_authority_accounting ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX idx_client_authority_accounting_client_id ON public.client_authority_accounting(client_id);
CREATE INDEX idx_client_authority_accounting_authority_id ON public.client_authority_accounting(authority_id);

-- RLS Policies
CREATE POLICY "Users can view client authority accounting for their organization"
ON public.client_authority_accounting
FOR SELECT
USING (
  organization_id = get_user_organization_id(auth.uid())
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'branch_admin'::app_role)
);

CREATE POLICY "Users can insert client authority accounting for their organization"
ON public.client_authority_accounting
FOR INSERT
WITH CHECK (
  organization_id = get_user_organization_id(auth.uid())
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'branch_admin'::app_role)
);

CREATE POLICY "Users can update client authority accounting for their organization"
ON public.client_authority_accounting
FOR UPDATE
USING (
  organization_id = get_user_organization_id(auth.uid())
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'branch_admin'::app_role)
);

CREATE POLICY "Users can delete client authority accounting for their organization"
ON public.client_authority_accounting
FOR DELETE
USING (
  organization_id = get_user_organization_id(auth.uid())
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'branch_admin'::app_role)
);

-- Create trigger for updated_at
CREATE TRIGGER update_client_authority_accounting_updated_at
BEFORE UPDATE ON public.client_authority_accounting
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();