-- Create is_system_admin function to check for super_admin role
CREATE OR REPLACE FUNCTION public.is_system_admin(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_id_param 
    AND role = 'super_admin'::app_role
  );
$$;

-- Update RLS policies on organizations table to allow system admins
DROP POLICY IF EXISTS "System admins can manage all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can update their organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;

-- Create new comprehensive RLS policies for organizations
CREATE POLICY "System admins can manage all organizations" 
ON public.organizations 
FOR ALL 
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

CREATE POLICY "Organization members can view their organization" 
ON public.organizations 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    is_system_admin(auth.uid()) OR 
    id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  )
);

-- Ensure there's at least one super_admin user for testing
-- This will insert a super_admin role for the first authenticated user if none exists
DO $$
DECLARE
  first_user_id uuid;
  admin_count integer;
BEGIN
  -- Check if any super_admin exists
  SELECT COUNT(*) INTO admin_count FROM public.user_roles WHERE role = 'super_admin';
  
  -- If no super_admin exists, make the first user a super_admin
  IF admin_count = 0 THEN
    SELECT id INTO first_user_id FROM auth.users ORDER BY created_at LIMIT 1;
    
    IF first_user_id IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role) 
      VALUES (first_user_id, 'super_admin')
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  END IF;
END $$;