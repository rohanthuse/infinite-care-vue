-- Fix RLS policies for staff table to allow carers to update their own profiles
-- Drop existing RLS policies on staff table
DROP POLICY IF EXISTS "Staff can view their own profile" ON public.staff;
DROP POLICY IF EXISTS "Staff can update their own profile" ON public.staff;
DROP POLICY IF EXISTS "Branch admins can manage staff" ON public.staff;
DROP POLICY IF EXISTS "Super admins can manage all staff" ON public.staff;

-- Create comprehensive RLS policies for staff table
-- Allow staff to view their own profile using both id and auth_user_id
CREATE POLICY "Staff can view their own profile"
  ON public.staff
  FOR SELECT
  USING (id = auth.uid() OR auth_user_id = auth.uid());

-- Allow staff to update their own profile using both id and auth_user_id
CREATE POLICY "Staff can update their own profile"
  ON public.staff
  FOR UPDATE
  USING (id = auth.uid() OR auth_user_id = auth.uid());

-- Allow branch admins to manage staff in their branches
CREATE POLICY "Branch admins can manage staff"
  ON public.staff
  FOR ALL
  USING (branch_id IN (
    SELECT branch_id FROM public.admin_branches 
    WHERE admin_id = auth.uid()
  ));

-- Allow super admins to manage all staff
CREATE POLICY "Super admins can manage all staff"
  ON public.staff
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Drop and recreate get_staff_profile_by_auth_user_id function
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
  invitation_accepted_at timestamp with time zone
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
    s.invitation_accepted_at
  FROM public.staff s
  WHERE s.auth_user_id = auth_user_id_param;
END;
$$;

-- Ensure staff_documents storage bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public)
VALUES ('staff-documents', 'staff-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for staff-documents storage bucket
DROP POLICY IF EXISTS "Staff can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all staff documents" ON storage.objects;

-- Policies for staff-documents bucket
CREATE POLICY "Staff can view their own documents"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'staff-documents' AND (
    -- Allow if the user is the uploader
    auth.uid()::text = (storage.foldername(name))[1] OR
    -- Allow if they are staff member accessing their own folder
    EXISTS (
      SELECT 1 FROM public.staff s 
      WHERE s.auth_user_id = auth.uid() 
      AND s.id::text = (storage.foldername(name))[1]
    )
  ));

CREATE POLICY "Staff can upload their own documents"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'staff-documents' AND (
    -- Allow if uploading to their auth user folder
    auth.uid()::text = (storage.foldername(name))[1] OR
    -- Allow if they are staff member uploading to their own folder
    EXISTS (
      SELECT 1 FROM public.staff s 
      WHERE s.auth_user_id = auth.uid() 
      AND s.id::text = (storage.foldername(name))[1]
    )
  ));

CREATE POLICY "Staff can update their own documents"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'staff-documents' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM public.staff s 
      WHERE s.auth_user_id = auth.uid() 
      AND s.id::text = (storage.foldername(name))[1]
    )
  ));

CREATE POLICY "Staff can delete their own documents"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'staff-documents' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM public.staff s 
      WHERE s.auth_user_id = auth.uid() 
      AND s.id::text = (storage.foldername(name))[1]
    )
  ));

-- Allow admins to view all staff documents in their branches
CREATE POLICY "Admins can view all staff documents"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'staff-documents' AND (
    has_role(auth.uid(), 'super_admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM public.staff s
      JOIN public.admin_branches ab ON s.branch_id = ab.branch_id
      WHERE s.id::text = (storage.foldername(name))[1]
      AND ab.admin_id = auth.uid()
    )
  ));