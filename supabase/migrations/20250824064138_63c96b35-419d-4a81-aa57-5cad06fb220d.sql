
-- 1) Add photo_url column to staff
ALTER TABLE public.staff
ADD COLUMN IF NOT EXISTS photo_url text;

-- 2) Ensure public bucket for staff photos exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('staff-photos', 'staff-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 3) Storage policies for staff-photos
-- Drop any existing policies with the same names to avoid duplicates
DROP POLICY IF EXISTS "Public read for staff photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own staff photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own staff photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own staff photos" ON storage.objects;

-- Public read (for avatar display via public URL)
CREATE POLICY "Public read for staff photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'staff-photos');

-- Authenticated users can upload only into their own folder (first path segment = auth.uid())
CREATE POLICY "Users can upload their own staff photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'staff-photos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can update only their own files
CREATE POLICY "Users can update their own staff photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'staff-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can delete only their own files
CREATE POLICY "Users can delete their own staff photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'staff-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4) Update the profile RPC to return photo_url
DROP FUNCTION IF EXISTS public.get_staff_profile_by_auth_user_id(uuid);

CREATE OR REPLACE FUNCTION public.get_staff_profile_by_auth_user_id(auth_user_id_param uuid)
RETURNS TABLE (
  id uuid,
  auth_user_id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  address text,
  status text,
  experience text,
  specialization text,
  availability text,
  date_of_birth date,
  hire_date date,
  branch_id uuid,
  first_login_completed boolean,
  profile_completed boolean,
  national_insurance_number text,
  emergency_contact_name text,
  emergency_contact_phone text,
  qualifications text[],
  certifications text[],
  bank_name text,
  bank_account_name text,
  bank_account_number text,
  bank_sort_code text,
  invitation_accepted_at timestamp with time zone,
  photo_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.auth_user_id,
    s.first_name,
    s.last_name,
    s.email,
    s.phone,
    s.address,
    s.status,
    s.experience,
    s.specialization,
    s.availability,
    s.date_of_birth,
    s.hire_date,
    s.branch_id,
    s.first_login_completed,
    s.profile_completed,
    s.national_insurance_number,
    s.emergency_contact_name,
    s.emergency_contact_phone,
    s.qualifications,
    s.certifications,
    s.bank_name,
    s.bank_account_name,
    s.bank_account_number,
    s.bank_sort_code,
    s.invitation_accepted_at,
    s.photo_url
  FROM public.staff s
  WHERE s.auth_user_id = auth_user_id_param;
END;
$$;
