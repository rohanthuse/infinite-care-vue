
-- Function: Get care coordinators and carers for the logged-in client within an org
create or replace function public.get_client_care_team(p_org_id uuid)
returns table(
  user_id uuid,
  user_name text,
  user_type text,  -- 'admin' | 'carer'
  email text
)
language sql
security definer
set search_path = public
as $$
with client as (
  select c.id, c.branch_id
  from clients c
  join branches b on b.id = c.branch_id
  where c.auth_user_id = auth.uid()
    and b.organization_id = p_org_id
  limit 1
),
admins as (
  select
    ab.admin_id as user_id,
    coalesce(p.first_name || ' ' || p.last_name, 'Care Coordinator') as user_name,
    'admin'::text as user_type,
    p.email
  from admin_branches ab
  join client cl on cl.branch_id = ab.branch_id
  left join profiles p on p.id = ab.admin_id
),
assigned_carers as (
  select
    s.auth_user_id as user_id,
    coalesce(s.first_name || ' ' || s.last_name, 'Carer') as user_name,
    'carer'::text as user_type,
    s.email
  from bookings bk
  join client cl on cl.id = bk.client_id
  join staff s on s.id = bk.staff_id
  where s.status in ('Active','active')
    and s.auth_user_id is not null
),
branch_carers as (
  select
    s.auth_user_id as user_id,
    coalesce(s.first_name || ' ' || s.last_name, 'Carer') as user_name,
    'carer'::text as user_type,
    s.email
  from staff s
  join client cl on cl.branch_id = s.branch_id
  where s.status in ('Active','active')
    and s.auth_user_id is not null
)
select distinct on (user_id) user_id, user_name, user_type, email
from (
  select * from admins
  union all
  select * from assigned_carers
  union all
  select * from branch_carers
) x
where user_id is not null
order by user_id;
$$;

-- Permit authenticated users to execute the function
grant execute on function public.get_client_care_team(uuid) to authenticated;
