-- Drop and recreate sync_system_user_to_organization to fix return type
DROP FUNCTION IF EXISTS public.sync_system_user_to_organization(UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION public.sync_system_user_to_organization(
  p_system_user_id UUID,
  p_organization_id UUID,
  p_role TEXT DEFAULT 'member'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id UUID;
  v_result JSONB;
BEGIN
  -- Get the auth user_id from system_users table
  SELECT auth_user_id INTO v_auth_user_id
  FROM public.system_users
  WHERE id = p_system_user_id;

  IF v_auth_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'System user not found or has no auth_user_id'
    );
  END IF;

  -- Insert/update organization membership in organization_members
  INSERT INTO public.organization_members (
    organization_id, user_id, role, status, joined_at
  ) VALUES (
    p_organization_id, v_auth_user_id, p_role, 'active', now()
  ) ON CONFLICT (organization_id, user_id) 
  DO UPDATE SET 
    role = EXCLUDED.role,
    status = 'active',
    updated_at = now();

  -- ALSO insert into system_user_organizations for system user tracking
  INSERT INTO public.system_user_organizations (
    system_user_id, organization_id, role
  ) VALUES (
    p_system_user_id, p_organization_id, p_role
  ) ON CONFLICT (system_user_id, organization_id)
  DO UPDATE SET role = EXCLUDED.role;

  RETURN jsonb_build_object(
    'success', true,
    'system_user_id', p_system_user_id,
    'organization_id', p_organization_id,
    'auth_user_id', v_auth_user_id,
    'role', p_role
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;