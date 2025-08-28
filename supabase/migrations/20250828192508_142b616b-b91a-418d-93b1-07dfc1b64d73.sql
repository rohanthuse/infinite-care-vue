
-- Create a fast, unified access-check RPC to eliminate multiple roundtrips on login/redirect
create or replace function public.user_has_access_to_org(
  p_user_id uuid,
  p_organization_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  has_access boolean := false;
begin
  -- 1) System super admins always have access
  if public.has_role(p_user_id, 'super_admin') then
    return true;
  end if;

  -- 2) Organization members (active)
  select true into has_access
  from public.organization_members om
  where om.user_id = p_user_id
    and om.organization_id = p_organization_id
    and om.status = 'active'
  limit 1;

  if has_access then
    return true;
  end if;

  -- 3) Branch admins: admin_branches -> branches -> organization
  select true into has_access
  from public.admin_branches ab
  join public.branches b on b.id = ab.branch_id
  where ab.admin_id = p_user_id
    and b.organization_id = p_organization_id
  limit 1;

  if has_access then
    return true;
  end if;

  -- 4) Carers (staff): staff (Active) -> branches -> organization
  select true into has_access
  from public.staff s
  join public.branches b on b.id = s.branch_id
  where s.auth_user_id = p_user_id
    and s.status = 'Active'
    and b.organization_id = p_organization_id
  limit 1;

  if has_access then
    return true;
  end if;

  -- 5) Clients: clients -> branches -> organization
  select true into has_access
  from public.clients c
  join public.branches b on b.id = c.branch_id
  where c.auth_user_id = p_user_id
    and b.organization_id = p_organization_id
  limit 1;

  if has_access then
    return true;
  end if;

  return false;
end;
$$;
