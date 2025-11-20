-- Create enum for system tenant agreement status
CREATE TYPE system_tenant_agreement_status AS ENUM ('Active', 'Pending', 'Expired', 'Terminated');

-- Create enum for system tenant agreement file category
CREATE TYPE system_tenant_agreement_file_category AS ENUM ('document', 'signature', 'template', 'attachment');

-- Table: system_tenant_agreement_types
CREATE TABLE public.system_tenant_agreement_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: system_tenant_agreement_templates
CREATE TABLE public.system_tenant_agreement_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  type_id UUID REFERENCES public.system_tenant_agreement_types(id) ON DELETE SET NULL,
  template_file_id UUID,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.system_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: system_tenant_agreements
CREATE TABLE public.system_tenant_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  template_id UUID REFERENCES public.system_tenant_agreement_templates(id) ON DELETE SET NULL,
  type_id UUID REFERENCES public.system_tenant_agreement_types(id) ON DELETE SET NULL,
  status system_tenant_agreement_status NOT NULL DEFAULT 'Pending',
  signed_by_tenant TEXT,
  signed_by_system TEXT,
  tenant_signature_file_id UUID,
  system_signature_file_id UUID,
  signed_at TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  renewal_date TIMESTAMPTZ,
  created_by UUID REFERENCES public.system_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: system_tenant_agreement_files
CREATE TABLE public.system_tenant_agreement_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agreement_id UUID REFERENCES public.system_tenant_agreements(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.system_tenant_agreement_templates(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  file_category system_tenant_agreement_file_category NOT NULL DEFAULT 'document',
  uploaded_by UUID REFERENCES public.system_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key constraints for signature files
ALTER TABLE public.system_tenant_agreements
ADD CONSTRAINT fk_tenant_signature_file
FOREIGN KEY (tenant_signature_file_id) REFERENCES public.system_tenant_agreement_files(id) ON DELETE SET NULL;

ALTER TABLE public.system_tenant_agreements
ADD CONSTRAINT fk_system_signature_file
FOREIGN KEY (system_signature_file_id) REFERENCES public.system_tenant_agreement_files(id) ON DELETE SET NULL;

ALTER TABLE public.system_tenant_agreement_templates
ADD CONSTRAINT fk_template_file
FOREIGN KEY (template_file_id) REFERENCES public.system_tenant_agreement_files(id) ON DELETE SET NULL;

-- Enable RLS on all tables
ALTER TABLE public.system_tenant_agreement_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_tenant_agreement_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_tenant_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_tenant_agreement_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_tenant_agreement_types (super admins only)
CREATE POLICY "Super admins can view agreement types"
ON public.system_tenant_agreement_types FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.system_user_roles
    WHERE system_user_id = auth.uid()
    AND role = 'super_admin'
  )
);

CREATE POLICY "Super admins can insert agreement types"
ON public.system_tenant_agreement_types FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.system_user_roles
    WHERE system_user_id = auth.uid()
    AND role = 'super_admin'
  )
);

CREATE POLICY "Super admins can update agreement types"
ON public.system_tenant_agreement_types FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.system_user_roles
    WHERE system_user_id = auth.uid()
    AND role = 'super_admin'
  )
);

CREATE POLICY "Super admins can delete agreement types"
ON public.system_tenant_agreement_types FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.system_user_roles
    WHERE system_user_id = auth.uid()
    AND role = 'super_admin'
  )
);

-- RLS Policies for system_tenant_agreement_templates (super admins only)
CREATE POLICY "Super admins can view agreement templates"
ON public.system_tenant_agreement_templates FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.system_user_roles
    WHERE system_user_id = auth.uid()
    AND role = 'super_admin'
  )
);

CREATE POLICY "Super admins can insert agreement templates"
ON public.system_tenant_agreement_templates FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.system_user_roles
    WHERE system_user_id = auth.uid()
    AND role = 'super_admin'
  )
);

CREATE POLICY "Super admins can update agreement templates"
ON public.system_tenant_agreement_templates FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.system_user_roles
    WHERE system_user_id = auth.uid()
    AND role = 'super_admin'
  )
);

CREATE POLICY "Super admins can delete agreement templates"
ON public.system_tenant_agreement_templates FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.system_user_roles
    WHERE system_user_id = auth.uid()
    AND role = 'super_admin'
  )
);

-- RLS Policies for system_tenant_agreements (super admins only)
CREATE POLICY "Super admins can view tenant agreements"
ON public.system_tenant_agreements FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.system_user_roles
    WHERE system_user_id = auth.uid()
    AND role = 'super_admin'
  )
);

CREATE POLICY "Super admins can insert tenant agreements"
ON public.system_tenant_agreements FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.system_user_roles
    WHERE system_user_id = auth.uid()
    AND role = 'super_admin'
  )
);

CREATE POLICY "Super admins can update tenant agreements"
ON public.system_tenant_agreements FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.system_user_roles
    WHERE system_user_id = auth.uid()
    AND role = 'super_admin'
  )
);

CREATE POLICY "Super admins can delete tenant agreements"
ON public.system_tenant_agreements FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.system_user_roles
    WHERE system_user_id = auth.uid()
    AND role = 'super_admin'
  )
);

-- RLS Policies for system_tenant_agreement_files (super admins only)
CREATE POLICY "Super admins can view agreement files"
ON public.system_tenant_agreement_files FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.system_user_roles
    WHERE system_user_id = auth.uid()
    AND role = 'super_admin'
  )
);

CREATE POLICY "Super admins can insert agreement files"
ON public.system_tenant_agreement_files FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.system_user_roles
    WHERE system_user_id = auth.uid()
    AND role = 'super_admin'
  )
);

CREATE POLICY "Super admins can update agreement files"
ON public.system_tenant_agreement_files FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.system_user_roles
    WHERE system_user_id = auth.uid()
    AND role = 'super_admin'
  )
);

CREATE POLICY "Super admins can delete agreement files"
ON public.system_tenant_agreement_files FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.system_user_roles
    WHERE system_user_id = auth.uid()
    AND role = 'super_admin'
  )
);

-- Insert default agreement types
INSERT INTO public.system_tenant_agreement_types (name, description) VALUES
('Subscription Agreement', 'Standard subscription terms and conditions'),
('Service Level Agreement (SLA)', 'Service availability and performance commitments'),
('Data Processing Agreement', 'GDPR and data protection terms'),
('Master Services Agreement', 'Overall service engagement terms'),
('Non-Disclosure Agreement (NDA)', 'Confidentiality and information protection');

-- Add updated_at triggers
CREATE TRIGGER update_system_tenant_agreement_types_updated_at
BEFORE UPDATE ON public.system_tenant_agreement_types
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_tenant_agreement_templates_updated_at
BEFORE UPDATE ON public.system_tenant_agreement_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_tenant_agreements_updated_at
BEFORE UPDATE ON public.system_tenant_agreements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_tenant_agreement_files_updated_at
BEFORE UPDATE ON public.system_tenant_agreement_files
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();