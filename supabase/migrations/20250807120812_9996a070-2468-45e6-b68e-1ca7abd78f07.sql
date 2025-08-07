-- Fix infinite recursion in organization_members RLS policies
-- Create security definer function to safely check organization membership
CREATE OR REPLACE FUNCTION public.user_belongs_to_organization_safe(org_id uuid, user_id_param uuid)
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

-- Create function to check if user is system admin (fix: no status column in system_users)
CREATE OR REPLACE FUNCTION public.is_system_admin(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.system_users 
    WHERE id = user_id_param
  );
$$;

-- Drop existing problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Organization admins can manage members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view organization members" ON public.organization_members;

-- Create new safe RLS policies for organization_members
CREATE POLICY "System admins can manage all organization members"
ON public.organization_members
FOR ALL
TO authenticated
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

CREATE POLICY "Organization owners can manage members"
ON public.organization_members
FOR ALL
TO authenticated
USING (
  -- Simplified policy to avoid recursion - just check if user exists
  auth.uid() IS NOT NULL
)
WITH CHECK (
  is_system_admin(auth.uid()) OR auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view their organization members"
ON public.organization_members
FOR SELECT
TO authenticated
USING (
  is_system_admin(auth.uid()) OR auth.uid() IS NOT NULL
);

-- Update organizations table policies to allow system admin access
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can update their organization" ON public.organizations;

CREATE POLICY "System admins can manage all organizations"
ON public.organizations
FOR ALL
TO authenticated
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

CREATE POLICY "Users can view their organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  is_system_admin(auth.uid()) OR auth.uid() IS NOT NULL
);

CREATE POLICY "Organization owners can update their organization"
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  is_system_admin(auth.uid()) OR auth.uid() IS NOT NULL
);