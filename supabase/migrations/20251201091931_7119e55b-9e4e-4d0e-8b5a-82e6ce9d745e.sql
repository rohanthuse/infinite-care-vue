-- Fix infinite recursion in branches RLS policy
-- Replace direct user_roles query with has_role() SECURITY DEFINER function

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Tenant members can view their organization branches" ON public.branches;

-- Recreate the policy using the has_role() SECURITY DEFINER function
-- This prevents infinite recursion by not directly querying user_roles within the policy
CREATE POLICY "Tenant members can view their organization branches" 
ON public.branches
FOR SELECT
TO public
USING (
  (tenant_id = get_user_organization_id(auth.uid())) 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);