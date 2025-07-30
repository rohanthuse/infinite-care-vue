-- Fix RLS policies for training certificate uploads

-- Create security definer function to safely check if current user is the staff member
CREATE OR REPLACE FUNCTION public.is_current_staff_member(staff_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.staff 
    WHERE id = staff_id_param 
    AND auth_user_id = auth.uid()
  );
END;
$$;

-- Drop existing staff_training_records policies
DROP POLICY IF EXISTS "Users can view their own training records" ON public.staff_training_records;
DROP POLICY IF EXISTS "Users can update their own training records" ON public.staff_training_records;
DROP POLICY IF EXISTS "Admins can view all training records" ON public.staff_training_records;
DROP POLICY IF EXISTS "Admins can manage all training records" ON public.staff_training_records;

-- Create new RLS policies for staff_training_records that properly handle auth_user_id
CREATE POLICY "Staff can view their own training records" 
ON public.staff_training_records 
FOR SELECT 
USING (
  public.is_current_staff_member(staff_id) 
  OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'branch_admin')
  )
);

CREATE POLICY "Staff can update their own training records" 
ON public.staff_training_records 
FOR UPDATE 
USING (
  public.is_current_staff_member(staff_id)
  OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'branch_admin')
  )
);

CREATE POLICY "Staff can insert their own training records" 
ON public.staff_training_records 
FOR INSERT 
WITH CHECK (
  public.is_current_staff_member(staff_id)
  OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'branch_admin')
  )
);

CREATE POLICY "Admins can manage all training records" 
ON public.staff_training_records 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'branch_admin')
  )
);

-- Update storage policies to use staff auth_user_id relationship
DROP POLICY IF EXISTS "Staff can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete their own documents" ON storage.objects;

-- Create new storage policies that work with staff auth_user_id
CREATE POLICY "Staff can upload their own training documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'staff-documents' 
  AND EXISTS (
    SELECT 1 FROM public.staff 
    WHERE auth_user_id = auth.uid() 
    AND id::text = (storage.foldername(name))[3]
  )
);

CREATE POLICY "Staff can view their own training documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'staff-documents' 
  AND (
    EXISTS (
      SELECT 1 FROM public.staff 
      WHERE auth_user_id = auth.uid() 
      AND id::text = (storage.foldername(name))[3]
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'branch_admin')
    )
  )
);

CREATE POLICY "Staff can update their own training documents" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'staff-documents' 
  AND EXISTS (
    SELECT 1 FROM public.staff 
    WHERE auth_user_id = auth.uid() 
    AND id::text = (storage.foldername(name))[3]
  )
);

CREATE POLICY "Staff can delete their own training documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'staff-documents' 
  AND EXISTS (
    SELECT 1 FROM public.staff 
    WHERE auth_user_id = auth.uid() 
    AND id::text = (storage.foldername(name))[3]
  )
);

CREATE POLICY "Admins can view all staff training documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'staff-documents' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'branch_admin')
  )
);