-- Fix organization display for system users by querying system_user_organizations directly
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
  -- Validate session
  SELECT su.id, sur.role::text INTO session_user_id, session_user_role
  FROM public.system_sessions ss
  JOIN public.system_users su ON ss.system_user_id = su.id
  JOIN public.system_user_roles sur ON su.id = sur.system_user_id
  WHERE ss.session_token = p_session_token
    AND ss.expires_at > NOW()
  LIMIT 1;

  -- Check authorization
  IF session_user_id IS NULL OR session_user_role NOT IN ('super_admin', 'support_admin') THEN
    RAISE EXCEPTION 'Unauthorized: Invalid session or insufficient permissions';
  END IF;

  -- Return system users with their organizations from system_user_organizations
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
            'slug', o.slug,
            'role', suo.role
          )
        )
        FROM public.system_user_organizations suo
        JOIN public.organizations o ON suo.organization_id = o.id
        WHERE suo.system_user_id = su.id
      ),
      '[]'::jsonb
    ) as organizations
  FROM public.system_users su
  LEFT JOIN public.system_user_roles sur ON su.id = sur.system_user_id
  ORDER BY su.created_at DESC;
END;
$$;

-- Update the wrapper function
DROP FUNCTION IF EXISTS public.list_system_users_with_session(text);

CREATE OR REPLACE FUNCTION public.list_system_users_with_session(p_session_token text)
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
BEGIN
  RETURN QUERY SELECT * FROM public.list_system_users_with_session_and_orgs(p_session_token);
END;
$$;