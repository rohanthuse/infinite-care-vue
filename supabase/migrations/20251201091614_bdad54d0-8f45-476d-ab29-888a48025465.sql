-- Fix infinite recursion in organizations RLS policy
-- Replace direct user_roles query with is_app_admin() SECURITY DEFINER function

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "App admins can manage all organizations" ON public.organizations;

-- Recreate the policy using the existing is_app_admin() SECURITY DEFINER function
-- This prevents infinite recursion by not directly querying user_roles within the policy
CREATE POLICY "App admins can manage all organizations" 
ON public.organizations
FOR ALL 
TO public
USING (public.is_app_admin(auth.uid()))
WITH CHECK (public.is_app_admin(auth.uid()));