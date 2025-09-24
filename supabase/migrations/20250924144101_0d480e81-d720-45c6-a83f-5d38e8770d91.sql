-- Fix the sync function to handle existing roles gracefully
CREATE OR REPLACE FUNCTION sync_organization_members_with_roles()
RETURNS TABLE(
  user_id uuid,
  email text,
  org_role text,
  system_role app_role,
  action_taken text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_record RECORD;
  mapped_role app_role;
  role_exists BOOLEAN;
BEGIN
  FOR member_record IN 
    SELECT 
      om.user_id,
      om.role as org_role,
      au.email::text as email
    FROM organization_members om
    JOIN auth.users au ON om.user_id = au.id
    WHERE om.status = 'active'
  LOOP
    -- Map the organization role to system role
    mapped_role := map_org_role_to_system_role(member_record.org_role);
    
    -- Check if user role already exists
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = member_record.user_id 
      AND ur.role = mapped_role
    ) INTO role_exists;
    
    IF NOT role_exists THEN
      -- Try to create the missing user role
      INSERT INTO public.user_roles (user_id, role)
      VALUES (member_record.user_id, mapped_role)
      ON CONFLICT (user_id, role) DO NOTHING;
      
      -- Return the action taken
      RETURN QUERY SELECT 
        member_record.user_id,
        member_record.email,
        member_record.org_role,
        mapped_role,
        'created_missing_role'::text;
    ELSE
      -- Role already exists
      RETURN QUERY SELECT 
        member_record.user_id,
        member_record.email,
        member_record.org_role,
        mapped_role,
        'role_already_exists'::text;
    END IF;
  END LOOP;
END;
$$;