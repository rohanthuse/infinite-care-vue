-- Phase 1: Complete Tenant Data Isolation (Fixed)
-- Add missing organization_id columns first, then update data

-- Step 1: Add organization_id columns to all tables that need it
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.client_billing ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.travel_records ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.extra_time_records ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.visit_records ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.message_threads ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Step 2: Update branches first with organization data from existing admin_branches relationship
UPDATE public.branches SET organization_id = (
    SELECT DISTINCT om.organization_id 
    FROM public.organization_members om 
    JOIN public.admin_branches ab ON ab.admin_id = om.user_id 
    WHERE ab.branch_id = branches.id 
    LIMIT 1
) WHERE organization_id IS NULL;

-- Step 3: Update existing data to set organization_id based on branch_id for tables that have branch_id
UPDATE public.clients SET organization_id = (
    SELECT organization_id FROM public.branches WHERE branches.id = clients.branch_id
) WHERE organization_id IS NULL AND branch_id IS NOT NULL;

UPDATE public.staff SET organization_id = (
    SELECT organization_id FROM public.branches WHERE branches.id = staff.branch_id
) WHERE organization_id IS NULL AND branch_id IS NOT NULL;

UPDATE public.bookings SET organization_id = (
    SELECT organization_id FROM public.branches WHERE branches.id = bookings.branch_id
) WHERE organization_id IS NULL AND branch_id IS NOT NULL;

UPDATE public.expenses SET organization_id = (
    SELECT organization_id FROM public.branches WHERE branches.id = expenses.branch_id
) WHERE organization_id IS NULL AND branch_id IS NOT NULL;

UPDATE public.travel_records SET organization_id = (
    SELECT organization_id FROM public.branches WHERE branches.id = travel_records.branch_id
) WHERE organization_id IS NULL AND branch_id IS NOT NULL;

UPDATE public.extra_time_records SET organization_id = (
    SELECT organization_id FROM public.branches WHERE branches.id = extra_time_records.branch_id
) WHERE organization_id IS NULL AND branch_id IS NOT NULL;

UPDATE public.visit_records SET organization_id = (
    SELECT organization_id FROM public.branches WHERE branches.id = visit_records.branch_id
) WHERE organization_id IS NULL AND branch_id IS NOT NULL;

UPDATE public.forms SET organization_id = (
    SELECT organization_id FROM public.branches WHERE branches.id = forms.branch_id
) WHERE organization_id IS NULL AND branch_id IS NOT NULL;

UPDATE public.documents SET organization_id = (
    SELECT organization_id FROM public.branches WHERE branches.id = documents.branch_id
) WHERE organization_id IS NULL AND branch_id IS NOT NULL;

UPDATE public.notifications SET organization_id = (
    SELECT organization_id FROM public.branches WHERE branches.id = notifications.branch_id
) WHERE organization_id IS NULL AND branch_id IS NOT NULL;

UPDATE public.message_threads SET organization_id = (
    SELECT organization_id FROM public.branches WHERE branches.id = message_threads.branch_id
) WHERE organization_id IS NULL AND branch_id IS NOT NULL;

UPDATE public.reviews SET organization_id = (
    SELECT organization_id FROM public.branches WHERE branches.id = reviews.branch_id
) WHERE organization_id IS NULL AND branch_id IS NOT NULL;

-- Step 4: For client_billing, use client_id to get organization_id (now that organization_id column exists)
UPDATE public.client_billing SET organization_id = (
    SELECT organization_id FROM public.clients WHERE clients.id = client_billing.client_id
) WHERE organization_id IS NULL;

-- Step 5: Create subscription plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
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

-- Step 6: Insert default subscription plans (only if they don't exist)
INSERT INTO public.subscription_plans (name, description, price_monthly, price_yearly, max_users, max_branches, features) 
SELECT * FROM (VALUES
  ('free', 'Free Plan', 0, 0, 10, 1, '["basic_features", "1_branch", "10_users"]'::jsonb),
  ('basic', 'Basic Plan', 29, 290, 50, 3, '["all_features", "3_branches", "50_users", "email_support"]'::jsonb),
  ('professional', 'Professional Plan', 79, 790, 150, 10, '["all_features", "10_branches", "150_users", "priority_support", "custom_branding"]'::jsonb),
  ('enterprise', 'Enterprise Plan', 199, 1990, 500, 50, '["all_features", "unlimited_branches", "500_users", "premium_support", "custom_branding", "sso", "api_access"]'::jsonb)
) AS v(name, description, price_monthly, price_yearly, max_users, max_branches, features)
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE subscription_plans.name = v.name);

-- Step 7: Add subscription tracking to organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES public.subscription_plans(id);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '14 days');
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT true;

-- Step 8: Update existing organizations with basic plan
UPDATE public.organizations SET 
  subscription_plan_id = (SELECT id FROM public.subscription_plans WHERE name = 'basic' LIMIT 1),
  subscription_status = 'active',
  is_trial = false
WHERE subscription_plan_id IS NULL;