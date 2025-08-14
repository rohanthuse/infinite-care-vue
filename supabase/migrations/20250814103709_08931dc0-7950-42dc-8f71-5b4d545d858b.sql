-- Phase 1: Complete Tenant Data Isolation
-- Add missing organization_id columns to tables that only have branch_id

-- Add organization_id to tables that need it
ALTER TABLE public.clients ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.staff ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.bookings ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.services ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.client_billing ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.expenses ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.travel_records ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.extra_time_records ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.visit_records ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.forms ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.documents ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.message_threads ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Update existing data to set organization_id based on branch_id
UPDATE public.clients SET organization_id = (SELECT organization_id FROM public.branches WHERE branches.id = clients.branch_id) WHERE organization_id IS NULL;
UPDATE public.staff SET organization_id = (SELECT organization_id FROM public.branches WHERE branches.id = staff.branch_id) WHERE organization_id IS NULL;
UPDATE public.bookings SET organization_id = (SELECT organization_id FROM public.branches WHERE branches.id = bookings.branch_id) WHERE organization_id IS NULL;
UPDATE public.client_billing SET organization_id = (SELECT organization_id FROM public.branches WHERE branches.id = client_billing.branch_id) WHERE organization_id IS NULL;
UPDATE public.expenses SET organization_id = (SELECT organization_id FROM public.branches WHERE branches.id = expenses.branch_id) WHERE organization_id IS NULL;
UPDATE public.travel_records SET organization_id = (SELECT organization_id FROM public.branches WHERE branches.id = travel_records.branch_id) WHERE organization_id IS NULL;
UPDATE public.extra_time_records SET organization_id = (SELECT organization_id FROM public.branches WHERE branches.id = extra_time_records.branch_id) WHERE organization_id IS NULL;
UPDATE public.visit_records SET organization_id = (SELECT organization_id FROM public.branches WHERE branches.id = visit_records.branch_id) WHERE organization_id IS NULL;
UPDATE public.forms SET organization_id = (SELECT organization_id FROM public.branches WHERE branches.id = forms.branch_id) WHERE organization_id IS NULL;
UPDATE public.documents SET organization_id = (SELECT organization_id FROM public.branches WHERE branches.id = documents.branch_id) WHERE organization_id IS NULL;
UPDATE public.notifications SET organization_id = (SELECT organization_id FROM public.branches WHERE branches.id = notifications.branch_id) WHERE organization_id IS NULL;
UPDATE public.message_threads SET organization_id = (SELECT organization_id FROM public.branches WHERE branches.id = message_threads.branch_id) WHERE organization_id IS NULL;
UPDATE public.reviews SET organization_id = (SELECT organization_id FROM public.branches WHERE branches.id = reviews.branch_id) WHERE organization_id IS NULL;

-- Make organization_id NOT NULL for critical tables
ALTER TABLE public.clients ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.staff ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN organization_id SET NOT NULL;

-- Add organization_id to branches table to ensure proper linkage
ALTER TABLE public.branches ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Update branches with organization data from existing admin_branches relationship
UPDATE public.branches SET organization_id = (
    SELECT DISTINCT om.organization_id 
    FROM public.organization_members om 
    JOIN public.admin_branches ab ON ab.admin_id = om.user_id 
    WHERE ab.branch_id = branches.id 
    LIMIT 1
) WHERE organization_id IS NULL;

-- Create organization-level security functions
CREATE OR REPLACE FUNCTION public.get_user_organization_id(user_id_param uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT organization_id 
  FROM public.organization_members 
  WHERE user_id = user_id_param AND status = 'active' 
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_organization(org_id uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_members 
    WHERE organization_id = org_id AND user_id = user_id_param AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_system_admin(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = user_id_param AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_authenticated_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(is_system_admin(auth.uid()), false);
$$;

-- Drop existing RLS policies that don't enforce organization isolation
DROP POLICY IF EXISTS "Allow authenticated users to manage agreements" ON public.agreements;
DROP POLICY IF EXISTS "Allow authenticated users to delete client notes" ON public.client_notes;
DROP POLICY IF EXISTS "Allow authenticated users to insert client notes" ON public.client_notes;
DROP POLICY IF EXISTS "Allow authenticated users to read client notes" ON public.client_notes;
DROP POLICY IF EXISTS "Allow authenticated users to update client notes" ON public.client_notes;
DROP POLICY IF EXISTS "Allow authenticated users to manage communication_types" ON public.communication_types;

-- Create organization-aware RLS policies
CREATE POLICY "Organization members can manage agreements" ON public.agreements
FOR ALL USING (
  is_system_admin(auth.uid()) OR 
  user_belongs_to_organization(
    COALESCE(
      (SELECT organization_id FROM public.branches WHERE id = agreements.branch_id),
      (SELECT organization_id FROM public.clients WHERE id = agreements.signed_by_client_id)
    ), 
    auth.uid()
  )
);

CREATE POLICY "Organization members can manage client notes" ON public.client_notes
FOR ALL USING (
  is_system_admin(auth.uid()) OR 
  user_belongs_to_organization(
    (SELECT organization_id FROM public.clients WHERE id = client_notes.client_id), 
    auth.uid()
  )
);

CREATE POLICY "Organization members can manage communication types" ON public.communication_types
FOR ALL USING (
  is_system_admin(auth.uid()) OR auth.uid() IS NOT NULL
);

-- Update existing RLS policies to be organization-aware
DROP POLICY IF EXISTS "Allow public read access to all services" ON public.services;
CREATE POLICY "Organization members can view services" ON public.services
FOR SELECT USING (
  is_system_admin(auth.uid()) OR 
  organization_id IS NULL OR 
  user_belongs_to_organization(organization_id, auth.uid())
);

CREATE POLICY "Organization admins can manage services" ON public.services
FOR INSERT WITH CHECK (
  is_system_admin(auth.uid()) OR 
  user_belongs_to_organization(organization_id, auth.uid())
);

CREATE POLICY "Organization admins can update services" ON public.services
FOR UPDATE USING (
  is_system_admin(auth.uid()) OR 
  user_belongs_to_organization(organization_id, auth.uid())
);

CREATE POLICY "Organization admins can delete services" ON public.services
FOR DELETE USING (
  is_system_admin(auth.uid()) OR 
  user_belongs_to_organization(organization_id, auth.uid())
);

-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_users INTEGER DEFAULT 50,
  max_branches INTEGER DEFAULT 5,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price_monthly, price_yearly, max_users, max_branches, features) VALUES
('free', 'Free Plan', 0, 0, 10, 1, '["basic_features", "1_branch", "10_users"]'::jsonb),
('basic', 'Basic Plan', 29, 290, 50, 3, '["all_features", "3_branches", "50_users", "email_support"]'::jsonb),
('professional', 'Professional Plan', 79, 790, 150, 10, '["all_features", "10_branches", "150_users", "priority_support", "custom_branding"]'::jsonb),
('enterprise', 'Enterprise Plan', 199, 1990, 500, 50, '["all_features", "unlimited_branches", "500_users", "premium_support", "custom_branding", "sso", "api_access"]'::jsonb);

-- Add subscription tracking to organizations
ALTER TABLE public.organizations ADD COLUMN subscription_plan_id UUID REFERENCES public.subscription_plans(id);
ALTER TABLE public.organizations ADD COLUMN subscription_expires_at TIMESTAMPTZ;
ALTER TABLE public.organizations ADD COLUMN trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '14 days');
ALTER TABLE public.organizations ADD COLUMN is_trial BOOLEAN DEFAULT true;

-- Update existing organizations with basic plan
UPDATE public.organizations SET 
  subscription_plan_id = (SELECT id FROM public.subscription_plans WHERE name = 'basic' LIMIT 1),
  subscription_status = 'active',
  is_trial = false
WHERE subscription_plan_id IS NULL;

-- Enable RLS on subscription plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active subscription plans" ON public.subscription_plans
FOR SELECT USING (is_active = true);

CREATE POLICY "System admins can manage subscription plans" ON public.subscription_plans
FOR ALL USING (is_system_admin(auth.uid()));

-- Create system users table for super admins
CREATE TABLE public.system_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on system users
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins can manage system users" ON public.system_users
FOR ALL USING (is_system_admin(auth.uid()));

-- Create organization usage tracking
CREATE TABLE public.organization_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  active_users INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  storage_used_mb INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, usage_date)
);

-- Enable RLS on organization usage
ALTER TABLE public.organization_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view their usage" ON public.organization_usage
FOR SELECT USING (
  is_system_admin(auth.uid()) OR 
  user_belongs_to_organization(organization_id, auth.uid())
);

CREATE POLICY "System can insert usage data" ON public.organization_usage
FOR INSERT WITH CHECK (true);

-- Create function to enforce organization limits
CREATE OR REPLACE FUNCTION public.check_organization_limits()
RETURNS TRIGGER AS $$
DECLARE
  org_record RECORD;
  plan_record RECORD;
  current_users INTEGER;
  current_branches INTEGER;
BEGIN
  -- Get organization and plan info
  SELECT o.*, sp.max_users, sp.max_branches
  INTO org_record, plan_record
  FROM public.organizations o
  LEFT JOIN public.subscription_plans sp ON o.subscription_plan_id = sp.id
  WHERE o.id = COALESCE(NEW.organization_id, OLD.organization_id);
  
  IF NOT FOUND THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Check user limits on organization_members insert
  IF TG_TABLE_NAME = 'organization_members' AND TG_OP = 'INSERT' THEN
    SELECT COUNT(*) INTO current_users
    FROM public.organization_members
    WHERE organization_id = NEW.organization_id AND status = 'active';
    
    IF current_users >= plan_record.max_users THEN
      RAISE EXCEPTION 'Organization has reached maximum user limit of %', plan_record.max_users;
    END IF;
  END IF;
  
  -- Check branch limits on branches insert
  IF TG_TABLE_NAME = 'branches' AND TG_OP = 'INSERT' THEN
    SELECT COUNT(*) INTO current_branches
    FROM public.branches
    WHERE organization_id = NEW.organization_id;
    
    IF current_branches >= plan_record.max_branches THEN
      RAISE EXCEPTION 'Organization has reached maximum branch limit of %', plan_record.max_branches;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add triggers to enforce limits
CREATE TRIGGER enforce_user_limits
  BEFORE INSERT ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.check_organization_limits();

CREATE TRIGGER enforce_branch_limits
  BEFORE INSERT ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.check_organization_limits();