-- Set default value for joined_at column
ALTER TABLE public.organization_members 
ALTER COLUMN joined_at SET DEFAULT now();

-- Update existing NULL joined_at values to use created_at or invited_at as fallback
UPDATE public.organization_members 
SET joined_at = COALESCE(invited_at, created_at, now())
WHERE joined_at IS NULL;

-- Update the create_organization_member_with_role function to explicitly set joined_at
CREATE OR REPLACE FUNCTION create_organization_member_with_role(
  p_organization_id uuid,
  p_user_id uuid,
  p_role text,
  p_permissions jsonb DEFAULT '[]'::jsonb,
  p_invited_by uuid DEFAULT auth.uid()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  member_id uuid;
  system_role app_role;
BEGIN
  system_role := map_org_role_to_system_role(p_role);
  
  INSERT INTO public.organization_members (
    organization_id,
    user_id,
    role,
    permissions,
    invited_by,
    joined_at,
    status
  ) VALUES (
    p_organization_id,
    p_user_id,
    p_role,
    p_permissions,
    p_invited_by,
    now(),
    'active'
  ) RETURNING id INTO member_id;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, system_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN member_id;
END;
$$;