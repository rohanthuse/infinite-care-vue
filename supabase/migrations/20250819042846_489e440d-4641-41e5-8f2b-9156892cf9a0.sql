-- Create storage bucket for staff documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('staff-documents', 'staff-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policy for staff to upload their own documents
CREATE POLICY "Staff can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'staff-documents' 
  AND auth.uid() IN (
    SELECT s.auth_user_id 
    FROM public.staff s 
    WHERE s.id::text = (storage.foldername(name))[1]
  )
);

-- Create RLS policy for staff to view their own documents
CREATE POLICY "Staff can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'staff-documents' 
  AND auth.uid() IN (
    SELECT s.auth_user_id 
    FROM public.staff s 
    WHERE s.id::text = (storage.foldername(name))[1]
  )
);

-- Create RLS policy for staff to update their own documents
CREATE POLICY "Staff can update their own documents" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'staff-documents' 
  AND auth.uid() IN (
    SELECT s.auth_user_id 
    FROM public.staff s 
    WHERE s.id::text = (storage.foldername(name))[1]
  )
);

-- Create RLS policy for staff to delete their own documents
CREATE POLICY "Staff can delete their own documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'staff-documents' 
  AND auth.uid() IN (
    SELECT s.auth_user_id 
    FROM public.staff s 
    WHERE s.id::text = (storage.foldername(name))[1]
  )
);