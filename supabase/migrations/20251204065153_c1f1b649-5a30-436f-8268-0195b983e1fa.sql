-- Create system_templates table
CREATE TABLE public.system_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  requires_review BOOLEAN NOT NULL DEFAULT false,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft',
  settings JSONB DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create system_template_elements table
CREATE TABLE public.system_template_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.system_templates(id) ON DELETE CASCADE,
  element_type TEXT NOT NULL,
  label TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  validation_rules JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_system_templates_published ON public.system_templates(published);
CREATE INDEX idx_system_templates_created_by ON public.system_templates(created_by);
CREATE INDEX idx_system_template_elements_template_id ON public.system_template_elements(template_id);
CREATE INDEX idx_system_template_elements_order ON public.system_template_elements(template_id, order_index);

-- Enable RLS
ALTER TABLE public.system_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_template_elements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_templates

-- App admins can manage all system templates
CREATE POLICY "App admins can manage system templates"
ON public.system_templates
FOR ALL
USING (has_role(auth.uid(), 'app_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'app_admin'::app_role));

-- All authenticated users can read published templates (for tenant access)
CREATE POLICY "Authenticated users can read published templates"
ON public.system_templates
FOR SELECT
USING (published = true AND auth.role() = 'authenticated');

-- RLS Policies for system_template_elements

-- App admins can manage all template elements
CREATE POLICY "App admins can manage template elements"
ON public.system_template_elements
FOR ALL
USING (has_role(auth.uid(), 'app_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'app_admin'::app_role));

-- All authenticated users can read elements of published templates
CREATE POLICY "Authenticated users can read elements of published templates"
ON public.system_template_elements
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.system_templates st
    WHERE st.id = system_template_elements.template_id
    AND st.published = true
  )
  AND auth.role() = 'authenticated'
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_system_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_templates_updated_at
BEFORE UPDATE ON public.system_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_system_template_updated_at();

CREATE TRIGGER update_system_template_elements_updated_at
BEFORE UPDATE ON public.system_template_elements
FOR EACH ROW
EXECUTE FUNCTION public.update_system_template_updated_at();