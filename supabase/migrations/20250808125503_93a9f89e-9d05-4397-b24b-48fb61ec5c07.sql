
-- 1) Safe helper to read the current system user id from GUC
create or replace function public.get_current_system_user_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v text;
begin
  v := current_setting('app.current_system_user_id', true);
  if v is null then
    return null;
  end if;
  -- Simple UUID format check to avoid invalid cast errors
  if v ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return v::uuid;
  else
    return null;
  end if;
end;
$$;

-- 2) Non-recursive, RLS-safe role check for system users
create or replace function public.is_system_super_admin(_system_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.system_user_roles r
    where r.system_user_id = _system_user_id
      and r.role = 'super_admin'::public.system_role
  );
$$;

-- 3) Ensure RLS is enabled (idempotent)
alter table public.system_user_roles enable row level security;

-- 4) Replace the recursive policy with a helper-based one
drop policy if exists "Super admins can manage all roles" on public.system_user_roles;

create policy "Super admins can manage all roles"
on public.system_user_roles
for all
to public
using ( public.is_system_super_admin(public.get_current_system_user_id()) )
with check ( public.is_system_super_admin(public.get_current_system_user_id()) );

-- 5) Recreate the self-view policy using the safe helper (prevents invalid UUID casts)
drop policy if exists "Users can view their own roles" on public.system_user_roles;

create policy "Users can view their own roles"
on public.system_user_roles
for select
to public
using ( system_user_id = public.get_current_system_user_id() );
