
-- Create storage buckets for document management
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'audio/mpeg', 'audio/wav', 'text/plain']),
  ('client-documents', 'client-documents', false, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'audio/mpeg', 'audio/wav', 'text/plain'])
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for documents bucket
CREATE POLICY "Users can view documents in their branch" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' 
    AND (storage.foldername(name))[1] IN (
      SELECT ab.branch_id::text FROM public.admin_branches ab WHERE ab.admin_id = auth.uid()
      UNION
      SELECT s.branch_id::text FROM public.staff s WHERE s.id = auth.uid()
    )
  );

CREATE POLICY "Users can upload documents to their branch" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] IN (
      SELECT ab.branch_id::text FROM public.admin_branches ab WHERE ab.admin_id = auth.uid()
      UNION
      SELECT s.branch_id::text FROM public.staff s WHERE s.id = auth.uid()
    )
  );

CREATE POLICY "Users can update documents they uploaded" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents'
    AND owner = auth.uid()
  );

CREATE POLICY "Users can delete documents they uploaded" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents'
    AND owner = auth.uid()
  );

-- Create RLS policies for client-documents bucket
CREATE POLICY "Users can view client documents in their branch" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'client-documents' 
    AND (storage.foldername(name))[1] IN (
      SELECT ab.branch_id::text FROM public.admin_branches ab WHERE ab.admin_id = auth.uid()
      UNION
      SELECT s.branch_id::text FROM public.staff s WHERE s.id = auth.uid()
    )
  );

CREATE POLICY "Users can upload client documents to their branch" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'client-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT ab.branch_id::text FROM public.admin_branches ab WHERE ab.admin_id = auth.uid()
      UNION
      SELECT s.branch_id::text FROM public.staff s WHERE s.id = auth.uid()
    )
  );

CREATE POLICY "Users can update client documents they uploaded" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'client-documents'
    AND owner = auth.uid()
  );

CREATE POLICY "Users can delete client documents they uploaded" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'client-documents'
    AND owner = auth.uid()
  );
