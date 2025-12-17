-- Create authorities table for storing authority organizations
CREATE TABLE public.authorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  branch_id UUID REFERENCES public.branches(id),
  
  -- Authority Info (Section 1)
  organization_name TEXT NOT NULL,
  telephone TEXT,
  email TEXT,
  address TEXT,
  
  -- Key Contact (Section 2)
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  
  -- Invoice Configuration (Section 3)
  invoice_setting TEXT,
  invoice_name_display TEXT,
  billing_address TEXT,
  invoice_email TEXT,
  
  -- CM2000 Integration (Section 4)
  needs_cm2000 BOOLEAN DEFAULT false,
  
  -- Metadata
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.authorities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authorities
CREATE POLICY "Users can view authorities in their organization"
ON public.authorities
FOR SELECT
USING (
  organization_id = get_user_organization_id(auth.uid())
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'branch_admin'::app_role)
);

CREATE POLICY "Users can insert authorities in their organization"
ON public.authorities
FOR INSERT
WITH CHECK (
  organization_id = get_user_organization_id(auth.uid())
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'branch_admin'::app_role)
);

CREATE POLICY "Users can update authorities in their organization"
ON public.authorities
FOR UPDATE
USING (
  organization_id = get_user_organization_id(auth.uid())
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'branch_admin'::app_role)
);

CREATE POLICY "Users can delete authorities in their organization"
ON public.authorities
FOR DELETE
USING (
  organization_id = get_user_organization_id(auth.uid())
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'branch_admin'::app_role)
);

-- Create updated_at trigger
CREATE TRIGGER update_authorities_updated_at
BEFORE UPDATE ON public.authorities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();