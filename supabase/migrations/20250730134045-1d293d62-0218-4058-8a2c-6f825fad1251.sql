-- Fix authentication links and storage policies for training uploads

-- First, let's create a function to fix missing auth_user_id links for existing staff
CREATE OR REPLACE FUNCTION public.fix_staff_auth_links()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  staff_record RECORD;
  auth_user_id uuid;
  fixed_count INTEGER := 0;
  results JSONB := '[]'::JSONB;
BEGIN
  -- Find staff members without auth_user_id but with matching email in auth.users
  FOR staff_record IN 
    SELECT s.* FROM public.staff s
    WHERE s.auth_user_id IS NULL 
    AND s.email IS NOT NULL
  LOOP
    BEGIN
      -- Find the corresponding auth user
      SELECT id INTO auth_user_id 
      FROM auth.users 
      WHERE email = staff_record.email
      LIMIT 1;
      
      IF auth_user_id IS NOT NULL THEN
        -- Update the staff record to link to the auth user
        UPDATE public.staff 
        SET auth_user_id = auth_user_id,
            updated_at = now()
        WHERE id = staff_record.id;
        
        -- Ensure carer role exists
        INSERT INTO public.user_roles (user_id, role) 
        VALUES (auth_user_id, 'carer')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        fixed_count := fixed_count + 1;
        
        results := results || jsonb_build_object(
          'staff_id', staff_record.id,
          'staff_email', staff_record.email,
          'auth_user_id', auth_user_id,
          'status', 'fixed'
        );
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      results := results || jsonb_build_object(
        'staff_id', staff_record.id,
        'staff_email', staff_record.email,
        'status', 'error',
        'error_message', SQLERRM
      );
    END;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'fixed_count', fixed_count,
    'details', results
  );
END;
$$;

-- Run the fix function
SELECT public.fix_staff_auth_links();

-- Update storage policies to be more robust and handle the correct path structure
DROP POLICY IF EXISTS "Staff can upload their own training documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can view their own training documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can update their own training documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete their own training documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all staff training documents" ON storage.objects;

-- Create improved storage policies that work with the actual file path structure
-- Path structure: staff-documents/training-evidence/{staffId}/filename.ext
CREATE POLICY "Staff can upload training documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'staff-documents' 
  AND name LIKE 'training-evidence/%'
  AND (
    EXISTS (
      SELECT 1 FROM public.staff 
      WHERE auth_user_id = auth.uid() 
      AND name LIKE 'training-evidence/' || id::text || '/%'
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'branch_admin')
    )
  )
);

CREATE POLICY "Staff can view training documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'staff-documents' 
  AND name LIKE 'training-evidence/%'
  AND (
    EXISTS (
      SELECT 1 FROM public.staff 
      WHERE auth_user_id = auth.uid() 
      AND name LIKE 'training-evidence/' || id::text || '/%'
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'branch_admin')
    )
  )
);

CREATE POLICY "Staff can update training documents" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'staff-documents' 
  AND name LIKE 'training-evidence/%'
  AND (
    EXISTS (
      SELECT 1 FROM public.staff 
      WHERE auth_user_id = auth.uid() 
      AND name LIKE 'training-evidence/' || id::text || '/%'
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'branch_admin')
    )
  )
);

CREATE POLICY "Staff can delete training documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'staff-documents' 
  AND name LIKE 'training-evidence/%'
  AND (
    EXISTS (
      SELECT 1 FROM public.staff 
      WHERE auth_user_id = auth.uid() 
      AND name LIKE 'training-evidence/' || id::text || '/%'
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'branch_admin')
    )
  )
);

-- Create policy for admins to manage all training documents
CREATE POLICY "Admins can manage all training documents" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'staff-documents' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'branch_admin')
  )
);

-- Ensure staff-documents bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'staff-documents', 
  'staff-documents', 
  false, 
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];