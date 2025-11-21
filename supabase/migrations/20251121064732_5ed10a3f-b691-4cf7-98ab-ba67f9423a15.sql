-- Fix RLS for system_tenant_agreement_types so the system dashboard can read them

-- Drop old SELECT policy that depended on Supabase Auth (auth.uid()) and 'authenticated' role
DROP POLICY IF EXISTS "Super admins can view agreement types"
ON public.system_tenant_agreement_types;

-- New policy: allow public read of agreement types (lookup data)
CREATE POLICY "Public can view agreement types"
ON public.system_tenant_agreement_types
FOR SELECT
TO public
USING (true);