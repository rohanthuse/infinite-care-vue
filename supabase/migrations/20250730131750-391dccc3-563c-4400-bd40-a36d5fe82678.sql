-- Create storage bucket for staff documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('staff-documents', 'staff-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for staff documents
CREATE POLICY "Staff can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'staff-documents' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Staff can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'staff-documents' 
  AND (
    auth.uid()::text = (storage.foldername(name))[2]
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'branch_admin')
    )
  )
);

CREATE POLICY "Staff can update their own documents" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'staff-documents' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Staff can delete their own documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'staff-documents' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Admins can view all staff documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'staff-documents' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'branch_admin')
  )
);