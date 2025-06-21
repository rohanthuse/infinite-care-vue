
-- Create storage bucket for agreement files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agreement-files', 
  'agreement-files', 
  true, 
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Create RLS policies for storage bucket
CREATE POLICY "Anyone can view agreement files" ON storage.objects
  FOR SELECT USING (bucket_id = 'agreement-files');

CREATE POLICY "Authenticated users can upload agreement files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'agreement-files');

CREATE POLICY "Users can update their own agreement files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'agreement-files');

CREATE POLICY "Users can delete agreement files" ON storage.objects
  FOR DELETE USING (bucket_id = 'agreement-files');

-- Create agreement_files table for file metadata
CREATE TABLE public.agreement_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agreement_id UUID REFERENCES public.agreements(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.agreement_templates(id) ON DELETE CASCADE,
  scheduled_agreement_id UUID REFERENCES public.scheduled_agreements(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  file_category TEXT NOT NULL DEFAULT 'document' CHECK (file_category IN ('document', 'signature', 'template', 'attachment')),
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on agreement_files
ALTER TABLE public.agreement_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for agreement_files
CREATE POLICY "Users can view agreement files" 
  ON public.agreement_files 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create agreement files" 
  ON public.agreement_files 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update agreement files" 
  ON public.agreement_files 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete agreement files" 
  ON public.agreement_files 
  FOR DELETE 
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_agreement_files_updated_at
  BEFORE UPDATE ON public.agreement_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add file reference columns to existing tables
ALTER TABLE public.agreements 
ADD COLUMN primary_document_id UUID REFERENCES public.agreement_files(id),
ADD COLUMN signature_file_id UUID REFERENCES public.agreement_files(id);

ALTER TABLE public.agreement_templates 
ADD COLUMN template_file_id UUID REFERENCES public.agreement_files(id);

ALTER TABLE public.scheduled_agreements 
ADD COLUMN attachment_file_id UUID REFERENCES public.agreement_files(id);
