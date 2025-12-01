-- Update get_super_admin_org to accept any admin-level role
CREATE OR REPLACE FUNCTION public.get_super_admin_org(p_user_id uuid)
RETURNS TABLE(slug text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  select o.slug
  from public.system_users su
  join public.system_user_organizations suo on suo.system_user_id = su.id
  join public.organizations o on o.id = suo.organization_id
  where su.auth_user_id = p_user_id
    and suo.role IN ('super_admin', 'admin', 'app_admin')
  limit 1;
$$;