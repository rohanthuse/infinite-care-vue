-- Fix type casting issue in system users RPC function
DROP FUNCTION IF EXISTS public.list_system_users_with_session_and_orgs(text);

CREATE OR REPLACE FUNCTION public.list_system_users_with_session_and_orgs(p_session_token text)
RETURNS TABLE(
  id uuid,
  email text,
  first_name text,
  last_name text,
  is_active boolean,
  last_login_at timestamp with time zone,
  created_at timestamp with time zone,
  role text,
  organizations jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_user_id uuid;
  session_user_role text;
BEGIN
  -- Validate session using only existing columns
  SELECT su.id, sur.role::text INTO session_user_id, session_user_role
  FROM public.system_sessions ss
  JOIN public.system_users su ON ss.system_user_id = su.id
  JOIN public.system_user_roles sur ON su.id = sur.system_user_id
  WHERE ss.session_token = p_session_token
    AND ss.expires_at > NOW()
  LIMIT 1;

  -- Check if session is valid and user has appropriate role
  IF session_user_id IS NULL OR session_user_role NOT IN ('super_admin', 'support_admin') THEN
    RAISE EXCEPTION 'Unauthorized: Invalid session or insufficient permissions';
  END IF;

  -- Return system users with their organizations - FIX: Cast enum to text
  RETURN QUERY
  SELECT 
    su.id,
    su.email,
    su.first_name,
    su.last_name,
    su.is_active,
    su.last_login_at,
    su.created_at,
    COALESCE(sur.role::text, 'support_admin') as role,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', o.id,
            'name', o.name,
            'slug', o.slug
          )
        )
        FROM auth.users au
        JOIN public.organization_members om ON au.id = om.user_id
        JOIN public.organizations o ON om.organization_id = o.id
        WHERE au.email = su.email
          AND om.status = 'active'
      ),
      '[]'::jsonb
    ) as organizations
  FROM public.system_users su
  LEFT JOIN public.system_user_roles sur ON su.id = sur.system_user_id
  ORDER BY su.created_at DESC;
END;
$$;