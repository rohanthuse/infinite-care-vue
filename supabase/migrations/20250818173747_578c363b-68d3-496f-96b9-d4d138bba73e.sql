-- Fix the new function's search path issue and seed data for existing organizations
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Seed parameters for all existing organizations
DO $$
DECLARE
  org_record RECORD;
BEGIN
  FOR org_record IN 
    SELECT id FROM public.organizations
  LOOP
    PERFORM public.seed_default_parameters_for_organization(org_record.id);
  END LOOP;
END $$;