-- Create organizations table for multi-tenant support
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subdomain TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#1E40AF',
  secondary_color TEXT DEFAULT '#F3F4F6',
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  billing_email TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'active',
  subscription_plan TEXT NOT NULL DEFAULT 'basic',
  max_users INTEGER DEFAULT 50,
  max_branches INTEGER DEFAULT 5,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create organization_members table to link users to organizations
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  permissions JSONB DEFAULT '[]',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  joined_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Add tenant_id to core tables starting with branches
ALTER TABLE public.branches ADD COLUMN tenant_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_branches_tenant_id ON public.branches(tenant_id);
CREATE INDEX idx_organizations_subdomain ON public.organizations(subdomain);
CREATE INDEX idx_organization_members_org_user ON public.organization_members(organization_id, user_id);

-- Enable RLS on new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organizations
CREATE POLICY "Users can view their organization" 
ON public.organizations 
FOR SELECT 
USING (
  id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Organization owners can update their organization" 
ON public.organizations 
FOR UPDATE 
USING (
  id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
  )
);

-- Create RLS policies for organization_members
CREATE POLICY "Users can view organization members" 
ON public.organization_members 
FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members om 
    WHERE om.user_id = auth.uid() AND om.status = 'active'
  )
);

CREATE POLICY "Organization admins can manage members" 
ON public.organization_members 
FOR ALL 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members om 
    WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin') AND om.status = 'active'
  )
);

-- Create function to get user's organization
CREATE OR REPLACE FUNCTION public.get_user_organization_id(user_id_param UUID)
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT organization_id 
  FROM public.organization_members 
  WHERE user_id = user_id_param AND status = 'active' 
  LIMIT 1;
$$;

-- Create function to check if user belongs to organization
CREATE OR REPLACE FUNCTION public.user_belongs_to_organization(org_id UUID, user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_members 
    WHERE organization_id = org_id AND user_id = user_id_param AND status = 'active'
  );
$$;

-- Update branches RLS policy to include tenant isolation
DROP POLICY IF EXISTS "Branch admins can manage their branches" ON public.branches;
DROP POLICY IF EXISTS "Super admins can manage all branches" ON public.branches;

CREATE POLICY "Tenant members can view their organization branches" 
ON public.branches 
FOR SELECT 
USING (
  tenant_id = public.get_user_organization_id(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Tenant admins can manage their organization branches" 
ON public.branches 
FOR ALL 
USING (
  tenant_id = public.get_user_organization_id(auth.uid()) AND
  EXISTS (
    SELECT 1 
    FROM public.organization_members 
    WHERE organization_id = tenant_id AND user_id = auth.uid() 
    AND role IN ('owner', 'admin') AND status = 'active'
  )
) 
WITH CHECK (
  tenant_id = public.get_user_organization_id(auth.uid()) AND
  EXISTS (
    SELECT 1 
    FROM public.organization_members 
    WHERE organization_id = tenant_id AND user_id = auth.uid() 
    AND role IN ('owner', 'admin') AND status = 'active'
  )
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();