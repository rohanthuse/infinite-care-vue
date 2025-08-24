
-- 1) Ensure the bucket exists and is public (for public image URLs)
insert into storage.buckets (id, name, public)
values ('staff-photos', 'staff-photos', true)
on conflict (id) do update set public = true;

-- 2) Reset policies for the staff-photos bucket on storage.objects
drop policy if exists "Public read access for staff photos" on storage.objects;
drop policy if exists "Authenticated users can upload to staff-photos" on storage.objects;
drop policy if exists "Owners can update staff-photos objects" on storage.objects;
drop policy if exists "Owners can delete staff-photos objects" on storage.objects;
drop policy if exists "Admins can manage staff-photos objects" on storage.objects;

-- Allow public read access (for public URLs and listing if needed), scoped to this bucket
create policy "Public read access for staff photos"
on storage.objects for select
using (bucket_id = 'staff-photos');

-- Allow authenticated users to upload into the staff-photos bucket
create policy "Authenticated users can upload to staff-photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'staff-photos');

-- Allow owners (the uploading user) to update their own objects in this bucket
create policy "Owners can update staff-photos objects"
on storage.objects for update
to authenticated
using (bucket_id = 'staff-photos' and owner = auth.uid())
with check (bucket_id = 'staff-photos' and owner = auth.uid());

-- Allow owners to delete their own objects in this bucket
create policy "Owners can delete staff-photos objects"
on storage.objects for delete
to authenticated
using (bucket_id = 'staff-photos' and owner = auth.uid());

-- Optional: allow admins to manage any objects in this bucket
-- This uses your existing public.user_is_admin(user_id) function
create policy "Admins can manage staff-photos objects"
on storage.objects for all
to authenticated
using (bucket_id = 'staff-photos' and user_is_admin(auth.uid()))
with check (bucket_id = 'staff-photos' and user_is_admin(auth.uid()));
