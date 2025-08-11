
begin;

-- Drop problematic recursive policies
drop policy if exists "Organization owners can manage members" on public.organization_members;
drop policy if exists "System admins can manage all organization members" on public.organization_members;
drop policy if exists "Users can view their organization members" on public.organization_members;

-- Ensure RLS is enabled
alter table public.organization_members enable row level security;

-- Safe SELECT policy: admins OR members of the same organization can see rows
create policy "Admins or org members can read organization_members"
on public.organization_members
for select
using (
  public.user_is_admin(auth.uid())
  or public.user_belongs_to_organization(organization_id, auth.uid())
);

-- Safe INSERT policy: admins only
create policy "Admins can insert organization_members"
on public.organization_members
for insert
with check (
  public.user_is_admin(auth.uid())
);

-- Safe UPDATE policy: admins only
create policy "Admins can update organization_members"
on public.organization_members
for update
using (public.user_is_admin(auth.uid()))
with check (public.user_is_admin(auth.uid()));

-- Safe DELETE policy: admins only
create policy "Admins can delete organization_members"
on public.organization_members
for delete
using (public.user_is_admin(auth.uid()));

commit;
