
-- Ensure pgcrypto is available for password hashing
create extension if not exists pgcrypto;

-- Safely create a system user and assign a role, bypassing RLS via SECURITY DEFINER
-- This relies on your existing system session context (app.current_system_user_id)
-- and validates that the caller is a super_admin.
create or replace function public.create_system_user_and_role(
  p_email text,
  p_password text,
  p_first_name text,
  p_last_name text,
  p_role public.system_role default 'tenant_manager'
) returns json
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_caller_id uuid;
  v_is_super_admin boolean := false;
  v_user_id uuid;
begin
  -- Verify system session context is set
  v_caller_id := nullif(current_setting('app.current_system_user_id', true), '')::uuid;
  if v_caller_id is null then
    return json_build_object('success', false, 'error', 'Not authenticated as a system user');
  end if;

  -- Caller must be a system super_admin
  select exists (
    select 1
    from public.system_user_roles
    where system_user_id = v_caller_id
      and role = 'super_admin'
  ) into v_is_super_admin;

  if not v_is_super_admin then
    return json_build_object('success', false, 'error', 'Insufficient permissions');
  end if;

  -- Email must be unique in system_users
  if exists (select 1 from public.system_users where email = p_email) then
    return json_build_object('success', false, 'error', 'Email already exists');
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

  return json_build_object(
    'success', true,
    'user', (
      select row_to_json(u)
      from (
        select
          su.id,
          su.email,
          su.first_name,
          su.last_name,
          su.is_active,
          su.created_at
        from public.system_users su
        where su.id = v_user_id
      ) u
    ),
    'roles', (
      select coalesce(json_agg(r.role), '[]'::json)
      from public.system_user_roles r
      where r.system_user_id = v_user_id
    )
  );
exception
  when others then
    return json_build_object('success', false, 'error', sqlerrm);
end;
$function$;

-- Optional: make sure authenticated users can execute it (the internal check will gate access)
grant execute on function public.create_system_user_and_role(text, text, text, text, public.system_role) to authenticated;
