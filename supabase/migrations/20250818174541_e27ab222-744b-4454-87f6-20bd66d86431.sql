-- Phase 1: Add organization_id columns to bank_holidays and travel_rates
ALTER TABLE public.bank_holidays ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.travel_rates ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- Phase 2: Update ALL RLS policies to be stricter (remove organization_id.is.null fallbacks)

-- Drop existing policies
DROP POLICY IF EXISTS "Organization members can manage report_types" ON public.report_types;
DROP POLICY IF EXISTS "Organization members can manage communication_types" ON public.communication_types;
DROP POLICY IF EXISTS "Organization members can manage file_categories" ON public.file_categories;
DROP POLICY IF EXISTS "Organization members can manage expense_types" ON public.expense_types;

-- Create strict organization-scoped policies for report_types
CREATE POLICY "Organization members can manage report_types" ON public.report_types
FOR ALL USING (organization_id = get_user_organization_id(auth.uid()))
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

-- Create strict organization-scoped policies for communication_types  
CREATE POLICY "Organization members can manage communication_types" ON public.communication_types
FOR ALL USING (organization_id = get_user_organization_id(auth.uid()))
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

-- Create strict organization-scoped policies for file_categories
CREATE POLICY "Organization members can manage file_categories" ON public.file_categories
FOR ALL USING (organization_id = get_user_organization_id(auth.uid()))
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

-- Create strict organization-scoped policies for expense_types
CREATE POLICY "Organization members can manage expense_types" ON public.expense_types
FOR ALL USING (organization_id = get_user_organization_id(auth.uid()))
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

-- Create organization-scoped policies for bank_holidays
CREATE POLICY "Organization members can manage bank_holidays" ON public.bank_holidays
FOR ALL USING (organization_id = get_user_organization_id(auth.uid()))
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

-- Create organization-scoped policies for travel_rates
CREATE POLICY "Organization members can manage travel_rates" ON public.travel_rates
FOR ALL USING (organization_id = get_user_organization_id(auth.uid()))
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

-- Phase 3: Set organization_id for existing records by assigning them to the first organization
-- This is a data migration step - in production you'd want to assign to correct organizations

-- Update report_types with null organization_id
UPDATE public.report_types 
SET organization_id = (SELECT id FROM public.organizations ORDER BY created_at LIMIT 1)
WHERE organization_id IS NULL;

-- Update communication_types with null organization_id
UPDATE public.communication_types 
SET organization_id = (SELECT id FROM public.organizations ORDER BY created_at LIMIT 1)
WHERE organization_id IS NULL;

-- Update file_categories with null organization_id
UPDATE public.file_categories 
SET organization_id = (SELECT id FROM public.organizations ORDER BY created_at LIMIT 1)
WHERE organization_id IS NULL;

-- Update expense_types with null organization_id  
UPDATE public.expense_types 
SET organization_id = (SELECT id FROM public.organizations ORDER BY created_at LIMIT 1)
WHERE organization_id IS NULL;

-- Update bank_holidays with null organization_id
UPDATE public.bank_holidays 
SET organization_id = (SELECT id FROM public.organizations ORDER BY created_at LIMIT 1)
WHERE organization_id IS NULL;

-- Update travel_rates with null organization_id
UPDATE public.travel_rates 
SET organization_id = (SELECT id FROM public.organizations ORDER BY created_at LIMIT 1)
WHERE organization_id IS NULL;

-- Phase 4: Make organization_id NOT NULL for proper data integrity
ALTER TABLE public.report_types ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.communication_types ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.file_categories ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.expense_types ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.bank_holidays ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.travel_rates ALTER COLUMN organization_id SET NOT NULL;