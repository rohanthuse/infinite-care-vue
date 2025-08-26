
-- Ensure the storage bucket exists (safe if it already exists)
insert into storage.buckets (id, name, public)
values ('library-resources', 'library-resources', false)
on conflict do nothing;

-- Allow authorized users to download library resource files
drop policy if exists "Allow authorized users to download library resources" on storage.objects;

create policy "Allow authorized users to download library resources"
on storage.objects
for select
using (
  bucket_id = 'library-resources'
  and exists (
    select 1
    from public.library_resources lr
    where lr.file_path = storage.objects.name
      and lr.status = 'active'
      and (
        -- Super admins can access everything
        exists (
          select 1 from public.user_roles ur
          where ur.user_id = auth.uid() and ur.role = 'super_admin'::app_role
        )
        or
        -- Branch admins can access resources in their branches
        exists (
          select 1 from public.admin_branches ab
          where ab.admin_id = auth.uid()
            and ab.branch_id = lr.branch_id
        )
        or
        -- Staff/Carers in the same branch:
        -- Public resources OR private with access_roles including carer/staff (case-insensitive)
        (
          exists (
            select 1 from public.staff s
            where s.auth_user_id = auth.uid()
              and s.branch_id = lr.branch_id
          )
          and (
            lr.is_private = false
            or exists (
              select 1
              from unnest(lr.access_roles) as r(role)
              where lower(r.role) in ('carer','staff')
            )
          )
        )
        or
        -- Clients in the same branch:
        -- Public resources OR private with access_roles including client (case-insensitive)
        (
          exists (
            select 1 from public.clients c
            where c.auth_user_id = auth.uid()
              and c.branch_id = lr.branch_id
          )
          and (
            lr.is_private = false
            or exists (
              select 1
              from unnest(lr.access_roles) as r(role)
              where lower(r.role) = 'client'
            )
          )
        )
        or
        -- Fallback: the uploader can always access their own file
        (lr.uploaded_by = auth.uid())
      )
  )
);
