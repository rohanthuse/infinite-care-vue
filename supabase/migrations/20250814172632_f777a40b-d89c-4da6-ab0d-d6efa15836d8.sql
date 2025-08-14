-- Fix RLS policies for branches table to properly use organization_id
DROP POLICY IF EXISTS "Users can view branches for their organization" ON public.branches;
DROP POLICY IF EXISTS "Admin can manage branches for their organization" ON public.branches;
DROP POLICY IF EXISTS "Branch admins can manage branches" ON public.branches;
DROP POLICY IF EXISTS "Super admins can manage all branches" ON public.branches;
DROP POLICY IF EXISTS "Allow authenticated users to read branches" ON public.branches;
DROP POLICY IF EXISTS "Allow authenticated users to manage branches" ON public.branches;

-- Create consistent organization-scoped RLS policies for branches
CREATE POLICY "Users can view branches in their organization"
ON public.branches FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Admins can manage branches in their organization"
ON public.branches FOR ALL
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid() AND status = 'active'
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Create a function to get current user's organization ID
CREATE OR REPLACE FUNCTION public.get_current_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id 
  FROM public.organization_members 
  WHERE user_id = auth.uid() AND status = 'active' 
  LIMIT 1;
$$;