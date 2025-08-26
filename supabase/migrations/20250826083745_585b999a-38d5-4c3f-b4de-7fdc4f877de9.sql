-- Fix library resources RLS policies for consistent private resource access

-- First, drop existing conflicting policies
DROP POLICY IF EXISTS "Carers can view library resources" ON public.library_resources;
DROP POLICY IF EXISTS "Clients can view library resources" ON public.library_resources;
DROP POLICY IF EXISTS "Library resources - view access" ON public.library_resources;
DROP POLICY IF EXISTS "Users can view resources in their branch" ON public.library_resources;

-- Create a unified view policy that handles all user types consistently
CREATE POLICY "Unified library resources view policy" ON public.library_resources
FOR SELECT 
USING (
  -- Super admins can see everything
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'::app_role
  )
  OR 
  -- Branch admins can see resources in their branches
  (
    EXISTS (
      SELECT 1 FROM admin_branches ab 
      WHERE ab.admin_id = auth.uid() AND ab.branch_id = library_resources.branch_id
    )
  )
  OR
  -- Staff/Carers can see resources in their branch
  (
    EXISTS (
      SELECT 1 FROM staff s 
      WHERE s.auth_user_id = auth.uid() AND s.branch_id = library_resources.branch_id
    )
    AND (
      -- Public resources (not private)
      is_private = false
      OR 
      -- Private resources where carer role is explicitly granted (check both cases)
      (is_private = true AND (
        'carer' = ANY(access_roles) OR 
        'Carer' = ANY(access_roles) OR
        'staff' = ANY(access_roles) OR
        'Staff' = ANY(access_roles)
      ))
    )
  )
  OR
  -- Clients can see resources in their branch
  (
    EXISTS (
      SELECT 1 FROM clients c 
      WHERE c.auth_user_id = auth.uid() AND c.branch_id = library_resources.branch_id
    )
    AND (
      -- Public resources (not private)
      is_private = false
      OR 
      -- Private resources where client role is explicitly granted (check both cases)
      (is_private = true AND (
        'client' = ANY(access_roles) OR 
        'Client' = ANY(access_roles)
      ))
    )
  )
);