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

-- Create function to check if user is system admin
CREATE OR REPLACE FUNCTION public.is_system_admin(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.system_users 
    WHERE id = user_id_param AND status = 'active'
  );
$$;

-- Drop existing problematic policies
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
  -- Use direct query without referencing the same table to avoid recursion
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
    AND au.id IN (
      SELECT om.user_id FROM public.organization_members om 
      WHERE om.organization_id = organization_members.organization_id 
      AND om.role IN ('owner', 'admin') 
      AND om.status = 'active'
    )
  )
)
WITH CHECK (
  is_system_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
    AND au.id IN (
      SELECT om.user_id FROM public.organization_members om 
      WHERE om.organization_id = organization_members.organization_id 
      AND om.role IN ('owner', 'admin') 
      AND om.status = 'active'
    )
  )
);

CREATE POLICY "Users can view their organization members"
ON public.organization_members
FOR SELECT
TO authenticated
USING (
  is_system_admin(auth.uid()) OR
  organization_id IN (
    SELECT om.organization_id
    FROM public.organization_members om
    WHERE om.user_id = auth.uid() AND om.status = 'active'
  )
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
  is_system_admin(auth.uid()) OR
  id IN (
    SELECT om.organization_id
    FROM public.organization_members om
    WHERE om.user_id = auth.uid() AND om.status = 'active'
  )
);

CREATE POLICY "Organization owners can update their organization"
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  is_system_admin(auth.uid()) OR
  id IN (
    SELECT om.organization_id
    FROM public.organization_members om
    WHERE om.user_id = auth.uid() 
    AND om.role IN ('owner', 'admin') 
    AND om.status = 'active'
  )
);