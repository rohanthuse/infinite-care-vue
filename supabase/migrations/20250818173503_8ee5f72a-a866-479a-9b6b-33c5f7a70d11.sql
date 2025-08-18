-- Add organization_id columns to parameter tables for proper data isolation
ALTER TABLE public.report_types ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.communication_types ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.file_categories ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.expense_types ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- Create indexes for better performance
CREATE INDEX idx_report_types_organization_id ON public.report_types(organization_id);
CREATE INDEX idx_communication_types_organization_id ON public.communication_types(organization_id);
CREATE INDEX idx_file_categories_organization_id ON public.file_categories(organization_id);
CREATE INDEX idx_expense_types_organization_id ON public.expense_types(organization_id);

-- Update RLS policies for report_types
DROP POLICY IF EXISTS "Organization members can manage report_types" ON public.report_types;
CREATE POLICY "Organization members can manage report_types" ON public.report_types
FOR ALL USING (
  organization_id = get_user_organization_id(auth.uid()) OR 
  organization_id IS NULL
)
WITH CHECK (
  organization_id = get_user_organization_id(auth.uid())
);

-- Update RLS policies for communication_types
DROP POLICY IF EXISTS "Organization members can manage communication_types" ON public.communication_types;
CREATE POLICY "Organization members can manage communication_types" ON public.communication_types
FOR ALL USING (
  organization_id = get_user_organization_id(auth.uid()) OR 
  organization_id IS NULL
)
WITH CHECK (
  organization_id = get_user_organization_id(auth.uid())
);

-- Update RLS policies for file_categories
DROP POLICY IF EXISTS "Organization members can manage file_categories" ON public.file_categories;
CREATE POLICY "Organization members can manage file_categories" ON public.file_categories
FOR ALL USING (
  organization_id = get_user_organization_id(auth.uid()) OR 
  organization_id IS NULL
)
WITH CHECK (
  organization_id = get_user_organization_id(auth.uid())
);

-- Update RLS policies for expense_types
DROP POLICY IF EXISTS "Organization members can manage expense_types" ON public.expense_types;
CREATE POLICY "Organization members can manage expense_types" ON public.expense_types
FOR ALL USING (
  organization_id = get_user_organization_id(auth.uid()) OR 
  organization_id IS NULL
)
WITH CHECK (
  organization_id = get_user_organization_id(auth.uid())
);

-- Create a function to seed default parameters for new organizations
CREATE OR REPLACE FUNCTION public.seed_default_parameters_for_organization(org_id UUID)
RETURNS void AS $$
BEGIN
  -- Seed default report types
  INSERT INTO public.report_types (title, status, organization_id)
  SELECT title, status, org_id
  FROM public.report_types 
  WHERE organization_id IS NULL
  ON CONFLICT DO NOTHING;
  
  -- Seed default communication types
  INSERT INTO public.communication_types (title, status, organization_id)
  SELECT title, status, org_id
  FROM public.communication_types 
  WHERE organization_id IS NULL
  ON CONFLICT DO NOTHING;
  
  -- Seed default file categories
  INSERT INTO public.file_categories (title, status, organization_id)
  SELECT title, status, org_id
  FROM public.file_categories 
  WHERE organization_id IS NULL
  ON CONFLICT DO NOTHING;
  
  -- Seed default expense types
  INSERT INTO public.expense_types (title, status, organization_id)
  SELECT title, status, org_id
  FROM public.expense_types 
  WHERE organization_id IS NULL
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;