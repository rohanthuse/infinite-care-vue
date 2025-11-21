-- Fix RLS for system tenant agreement tables to work with custom system authentication
-- The system dashboard uses x-system-session-token header instead of Supabase auth.uid()

-- ============================================================================
-- 1. Fix RLS for system_tenant_agreements
-- ============================================================================

-- Drop old policies that depend on auth.uid() and 'authenticated' role
DROP POLICY IF EXISTS "Super admins can view tenant agreements" 
  ON public.system_tenant_agreements;
DROP POLICY IF EXISTS "Super admins can insert tenant agreements" 
  ON public.system_tenant_agreements;
DROP POLICY IF EXISTS "Super admins can update tenant agreements" 
  ON public.system_tenant_agreements;
DROP POLICY IF EXISTS "Super admins can delete tenant agreements" 
  ON public.system_tenant_agreements;

-- Create new policies using system session functions
CREATE POLICY "System super admins can view tenant agreements"
ON public.system_tenant_agreements
FOR SELECT
TO public
USING (
  is_system_super_admin(get_current_system_user_id())
);

CREATE POLICY "System super admins can insert tenant agreements"
ON public.system_tenant_agreements
FOR INSERT
TO public
WITH CHECK (
  is_system_super_admin(get_current_system_user_id())
);

CREATE POLICY "System super admins can update tenant agreements"
ON public.system_tenant_agreements
FOR UPDATE
TO public
USING (
  is_system_super_admin(get_current_system_user_id())
);

CREATE POLICY "System super admins can delete tenant agreements"
ON public.system_tenant_agreements
FOR DELETE
TO public
USING (
  is_system_super_admin(get_current_system_user_id())
);

-- ============================================================================
-- 2. Fix RLS for system_tenant_agreement_templates
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Super admins can view agreement templates" 
  ON public.system_tenant_agreement_templates;
DROP POLICY IF EXISTS "Super admins can insert agreement templates" 
  ON public.system_tenant_agreement_templates;
DROP POLICY IF EXISTS "Super admins can update agreement templates" 
  ON public.system_tenant_agreement_templates;
DROP POLICY IF EXISTS "Super admins can delete agreement templates" 
  ON public.system_tenant_agreement_templates;

-- Create new policies
CREATE POLICY "System super admins can view agreement templates"
ON public.system_tenant_agreement_templates
FOR SELECT
TO public
USING (
  is_system_super_admin(get_current_system_user_id())
);

CREATE POLICY "System super admins can insert agreement templates"
ON public.system_tenant_agreement_templates
FOR INSERT
TO public
WITH CHECK (
  is_system_super_admin(get_current_system_user_id())
);

CREATE POLICY "System super admins can update agreement templates"
ON public.system_tenant_agreement_templates
FOR UPDATE
TO public
USING (
  is_system_super_admin(get_current_system_user_id())
);

CREATE POLICY "System super admins can delete agreement templates"
ON public.system_tenant_agreement_templates
FOR DELETE
TO public
USING (
  is_system_super_admin(get_current_system_user_id())
);

-- ============================================================================
-- 3. Fix RLS for system_tenant_agreement_files
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Super admins can view agreement files" 
  ON public.system_tenant_agreement_files;
DROP POLICY IF EXISTS "Super admins can insert agreement files" 
  ON public.system_tenant_agreement_files;
DROP POLICY IF EXISTS "Super admins can update agreement files" 
  ON public.system_tenant_agreement_files;
DROP POLICY IF EXISTS "Super admins can delete agreement files" 
  ON public.system_tenant_agreement_files;

-- Create new policies
CREATE POLICY "System super admins can view agreement files"
ON public.system_tenant_agreement_files
FOR SELECT
TO public
USING (
  is_system_super_admin(get_current_system_user_id())
);

CREATE POLICY "System super admins can insert agreement files"
ON public.system_tenant_agreement_files
FOR INSERT
TO public
WITH CHECK (
  is_system_super_admin(get_current_system_user_id())
);

CREATE POLICY "System super admins can update agreement files"
ON public.system_tenant_agreement_files
FOR UPDATE
TO public
USING (
  is_system_super_admin(get_current_system_user_id())
);

CREATE POLICY "System super admins can delete agreement files"
ON public.system_tenant_agreement_files
FOR DELETE
TO public
USING (
  is_system_super_admin(get_current_system_user_id())
);