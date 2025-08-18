-- Fix the seeding function to handle all required columns properly
CREATE OR REPLACE FUNCTION public.seed_default_parameters_for_organization(org_id UUID)
RETURNS void AS $$
BEGIN
  -- Seed default report types (copy all columns)
  INSERT INTO public.report_types (title, status, organization_id)
  SELECT title, status, org_id
  FROM public.report_types 
  WHERE organization_id IS NULL
  ON CONFLICT DO NOTHING;
  
  -- Seed default communication types (copy all columns)
  INSERT INTO public.communication_types (title, status, organization_id)
  SELECT title, status, org_id
  FROM public.communication_types 
  WHERE organization_id IS NULL
  ON CONFLICT DO NOTHING;
  
  -- Seed default file categories (copy all columns)
  INSERT INTO public.file_categories (title, status, organization_id)
  SELECT title, status, org_id
  FROM public.file_categories 
  WHERE organization_id IS NULL
  ON CONFLICT DO NOTHING;
  
  -- Seed default expense types (copy all required columns including type)
  INSERT INTO public.expense_types (title, status, type, amount, tax, organization_id)
  SELECT title, status, COALESCE(type, 'general'), COALESCE(amount, 0), COALESCE(tax, 0), org_id
  FROM public.expense_types 
  WHERE organization_id IS NULL
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Now seed parameters for all existing organizations
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