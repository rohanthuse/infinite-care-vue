-- Create secure function to get super admin's organization slug
-- This bypasses RLS to reliably fetch the tenant assignment
create or replace function public.get_super_admin_org(p_user_id uuid)
returns table (slug text)
language sql
stable
security definer
set search_path = public
as $$
  select o.slug
  from public.system_users su
  join public.system_user_organizations suo on suo.system_user_id = su.id
  join public.organizations o on o.id = suo.organization_id
  where su.auth_user_id = p_user_id
    and suo.role = 'super_admin'
  limit 1;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.get_super_admin_org(uuid) to authenticated;

comment on function public.get_super_admin_org is 'Securely retrieves the organization slug for a super admin user, bypassing RLS restrictions';