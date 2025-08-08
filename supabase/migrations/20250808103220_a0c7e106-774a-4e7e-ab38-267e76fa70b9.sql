
-- 1) Create safe helper: validate a system session token and return system_user_id
-- Uses SECURITY DEFINER to avoid RLS issues
create or replace function public._validate_system_session(p_session_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_system_user_id uuid;
begin
  select ss.system_user_id
  into v_system_user_id
  from public.system_sessions ss
  join public.system_users su on su.id = ss.system_user_id
  where ss.session_token = p_session_token
    and ss.expires_at > now()
    and su.is_active = true
  limit 1;

  return v_system_user_id; -- may be null if invalid/expired
end;
$$;

-- 2) Create function to check if a system user is super_admin
create or replace function public._is_system_super_admin(p_system_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.system_user_roles sur
    where sur.system_user_id = p_system_user_id
      and sur.role = 'super_admin'
  );
$$;

-- 3) Safe create system user + assign role, using session token
create or replace function public.create_system_user_and_role_with_session(
  p_session_token text,
  p_email text,
  p_password text,
  p_first_name text,
  p_last_name text,
  p_role public.system_role default 'tenant_manager'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid;
  v_user_id uuid;
begin
  -- Validate session
  v_caller_id := public._validate_system_session(p_session_token);
  if v_caller_id is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated as a system user');
  end if;

  -- Require super_admin
  if not public._is_system_super_admin(v_caller_id) then
    return jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  end if;

  -- Email must be unique
  if exists (select 1 from public.system_users where email = p_email) then
    return jsonb_build_object('success', false, 'error', 'Email already exists');
  end if;

  -- Create user with hashed password
  insert into public.system_users (
    email,
    encrypted_password,
    first_name,
    last_name,
    is_active,
    created_by
  )
  values (
    p_email,
    crypt(p_password, gen_salt('bf')),
    p_first_name,
    p_last_name,
    true,
    v_caller_id
  )
  returning id into v_user_id;

  -- Assign initial role
  insert into public.system_user_roles (system_user_id, role, granted_by)
  values (v_user_id, p_role, v_caller_id);

  return jsonb_build_object(
    'success', true,
    'user', (
      select jsonb_build_object(
        'id', su.id,
        'email', su.email,
        'first_name', su.first_name,
        'last_name', su.last_name,
        'is_active', su.is_active,
        'created_at', su.created_at
      )
      from public.system_users su
      where su.id = v_user_id
    ),
    'roles', (
      select coalesce(jsonb_agg(r.role), '[]'::jsonb)
      from public.system_user_roles r
      where r.system_user_id = v_user_id
    )
  );
exception
  when others then
    return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$;

grant execute on function public.create_system_user_and_role_with_session(text, text, text, text, text, public.system_role)
  to anon, authenticated;

-- 4) List system users (with an effective role) using session token
create or replace function public.list_system_users_with_session(
  p_session_token text
)
returns table (
  id uuid,
  email text,
  first_name text,
  last_name text,
  is_active boolean,
  last_login_at timestamptz,
  created_at timestamptz,
  role public.system_role
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid;
begin
  v_caller_id := public._validate_system_session(p_session_token);
  if v_caller_id is null then
    raise exception 'Not authenticated as a system user';
  end if;

  if not public._is_system_super_admin(v_caller_id) then
    raise exception 'Insufficient permissions';
  end if;

  return query
  with role_priority as (
    select 'super_admin'::public.system_role as role, 1 as prio union all
    select 'tenant_manager', 2 union all
    select 'support_admin', 3 union all
    select 'analytics_viewer', 4
  ),
  effective_role as (
    select
      sur.system_user_id,
      -- pick the highest priority role
      (array_agg(sur.role order by rp.prio))[1] as role
    from public.system_user_roles sur
    join role_priority rp on rp.role = sur.role
    group by sur.system_user_id
  )
  select
    su.id,
    su.email,
    su.first_name,
    su.last_name,
    su.is_active,
    su.last_login_at,
    su.created_at,
    er.role
  from public.system_users su
  left join effective_role er on er.system_user_id = su.id
  order by su.created_at desc;
end;
$$;

grant execute on function public.list_system_users_with_session(text)
  to anon, authenticated;

-- 5) System user stats via session token
create or replace function public.get_system_user_stats_with_session(
  p_session_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid;
  v_total int := 0;
  v_active int := 0;
  v_inactive int := 0;
  v_super_admins int := 0;
begin
  v_caller_id := public._validate_system_session(p_session_token);
  if v_caller_id is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated as a system user');
  end if;

  if not public._is_system_super_admin(v_caller_id) then
    return jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  end if;

  select count(*) into v_total from public.system_users;
  select count(*) into v_active from public.system_users where is_active = true;
  select (v_total - v_active) into v_inactive;

  select count(*)
  into v_super_admins
  from public.system_user_roles sur
  where sur.role = 'super_admin';

  return jsonb_build_object(
    'success', true,
    'total', v_total,
    'active', v_active,
    'inactive', v_inactive,
    'superAdmins', v_super_admins
  );
end;
$$;

grant execute on function public.get_system_user_stats_with_session(text)
  to anon, authenticated;
