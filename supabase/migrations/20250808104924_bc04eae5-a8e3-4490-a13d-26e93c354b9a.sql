-- Create table to link system users to organizations
create table if not exists public.system_user_organizations (
  id uuid primary key default gen_random_uuid(),
  system_user_id uuid not null references public.system_users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role text not null default 'member',
  assigned_at timestamptz not null default now(),
  unique (system_user_id, organization_id)
);

-- Indexes for performance
create index if not exists idx_suo_system_user on public.system_user_organizations(system_user_id);
create index if not exists idx_suo_organization on public.system_user_organizations(organization_id);

-- Enable RLS
alter table public.system_user_organizations enable row level security;

-- Policies: restrict to system admins
create policy "System admins can manage system_user_organizations"
  on public.system_user_organizations
  for all
  using (is_authenticated_admin())
  with check (is_authenticated_admin());
