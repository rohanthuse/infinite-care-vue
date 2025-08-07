-- Create helper function to get current system session
CREATE OR REPLACE FUNCTION public.get_current_system_session()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  session_id uuid;
BEGIN
  -- This function would normally check session tokens from headers or cookies
  -- For now, we'll use a simplified approach by checking for active system sessions
  -- In a real implementation, you'd validate JWT tokens or session cookies
  
  -- Check if there's an active system session for the current context
  -- This is a simplified version - in production you'd validate actual session tokens
  SELECT id INTO session_id
  FROM public.system_sessions 
  WHERE is_active = true 
    AND expires_at > now()
    AND last_activity > now() - interval '1 hour'
  ORDER BY last_activity DESC
  LIMIT 1;
  
  RETURN session_id;
END;
$$;

-- Create function to get system user from active session
CREATE OR REPLACE FUNCTION public.get_current_system_user_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_id uuid;
  session_id uuid;
BEGIN
  session_id := get_current_system_session();
  
  IF session_id IS NOT NULL THEN
    SELECT system_user_id INTO user_id
    FROM public.system_sessions
    WHERE id = session_id;
  END IF;
  
  RETURN user_id;
END;
$$;

-- Create unified authentication function that checks both systems
CREATE OR REPLACE FUNCTION public.is_authenticated_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  system_user_id uuid;
  is_standard_admin boolean := false;
  is_system_admin boolean := false;
BEGIN
  -- Check standard Supabase authentication
  IF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    ) INTO is_standard_admin;
  END IF;
  
  -- Check system portal authentication
  system_user_id := get_current_system_user_id();
  IF system_user_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.system_user_roles
      WHERE system_user_id = system_user_id AND role = 'super_admin'
    ) INTO is_system_admin;
  END IF;
  
  RETURN is_standard_admin OR is_system_admin;
END;
$$;

-- Update the organizations table RLS policies to use the new function
DROP POLICY IF EXISTS "System admins can manage all organizations" ON public.organizations;

CREATE POLICY "System admins can manage all organizations"
ON public.organizations
FOR ALL
TO authenticated
USING (is_authenticated_admin())
WITH CHECK (is_authenticated_admin());

-- Update organization_members table policies as well
DROP POLICY IF EXISTS "System admins can manage all organization members" ON public.organization_members;

CREATE POLICY "System admins can manage all organization members"
ON public.organization_members
FOR ALL
TO authenticated
USING (is_authenticated_admin())
WITH CHECK (is_authenticated_admin());

-- Also update the view policy for organization members
DROP POLICY IF EXISTS "Users can view their organization members" ON public.organization_members;

CREATE POLICY "Users can view their organization members"
ON public.organization_members
FOR SELECT
TO authenticated
USING (
  is_authenticated_admin() OR 
  (auth.uid() IS NOT NULL AND id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = auth.uid() AND status = 'active'
  ))
);