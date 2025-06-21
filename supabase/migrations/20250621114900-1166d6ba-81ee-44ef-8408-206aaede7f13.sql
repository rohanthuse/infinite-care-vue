
-- Create a unified documents table that can handle all document types in the system
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  file_path TEXT,
  file_size TEXT,
  file_type TEXT,
  storage_bucket TEXT DEFAULT 'documents',
  uploaded_by UUID REFERENCES auth.users,
  uploaded_by_name TEXT,
  branch_id UUID REFERENCES public.branches(id),
  client_id UUID REFERENCES public.clients(id),
  staff_id UUID REFERENCES public.staff(id),
  form_id UUID REFERENCES public.forms(id),
  agreement_id UUID REFERENCES public.agreements(id),
  care_plan_id UUID REFERENCES public.client_care_plans(id),
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  access_level TEXT NOT NULL DEFAULT 'branch',
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Policy for users to view documents in their branch
CREATE POLICY "Users can view documents in their branch" 
ON public.documents FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    branch_id IN (
      SELECT b.id FROM public.branches b
      LEFT JOIN public.admin_branches ab ON b.id = ab.branch_id
      LEFT JOIN public.staff s ON b.id = s.branch_id
      WHERE ab.admin_id = auth.uid() OR s.id = auth.uid()
    )
  )
);

-- Policy for users to insert documents in their branch
CREATE POLICY "Users can upload documents in their branch" 
ON public.documents FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    branch_id IN (
      SELECT b.id FROM public.branches b
      LEFT JOIN public.admin_branches ab ON b.id = ab.branch_id
      LEFT JOIN public.staff s ON b.id = s.branch_id
      WHERE ab.admin_id = auth.uid() OR s.id = auth.uid()
    )
  )
);

-- Policy for users to update documents in their branch
CREATE POLICY "Users can update documents in their branch" 
ON public.documents FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND (
    branch_id IN (
      SELECT b.id FROM public.branches b
      LEFT JOIN public.admin_branches ab ON b.id = ab.branch_id
      LEFT JOIN public.staff s ON b.id = s.branch_id
      WHERE ab.admin_id = auth.uid() OR s.id = auth.uid()
    )
  )
);

-- Policy for users to delete documents in their branch
CREATE POLICY "Users can delete documents in their branch" 
ON public.documents FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND (
    branch_id IN (
      SELECT b.id FROM public.branches b
      LEFT JOIN public.admin_branches ab ON b.id = ab.branch_id
      LEFT JOIN public.staff s ON b.id = s.branch_id
      WHERE ab.admin_id = auth.uid() OR s.id = auth.uid()
    )
  )
);

-- Add updated_at trigger
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the documents bucket
CREATE POLICY "Users can view documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'documents');

CREATE POLICY "Users can upload documents" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update documents" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete documents" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

-- Function to get all documents with proper aggregation
CREATE OR REPLACE FUNCTION public.get_branch_documents(p_branch_id UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  type TEXT,
  category TEXT,
  description TEXT,
  file_path TEXT,
  file_size TEXT,
  file_type TEXT,
  uploaded_by_name TEXT,
  client_name TEXT,
  staff_name TEXT,
  tags TEXT[],
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  source_table TEXT,
  related_entity TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  -- Get documents from the new unified documents table
  SELECT 
    d.id,
    d.name,
    d.type,
    d.category,
    d.description,
    d.file_path,
    d.file_size,
    d.file_type,
    d.uploaded_by_name,
    CASE 
      WHEN d.client_id IS NOT NULL THEN CONCAT(c.first_name, ' ', c.last_name)
      ELSE NULL
    END as client_name,
    CASE 
      WHEN d.staff_id IS NOT NULL THEN CONCAT(s.first_name, ' ', s.last_name)
      ELSE NULL
    END as staff_name,
    d.tags,
    d.status,
    d.created_at,
    d.updated_at,
    'documents'::TEXT as source_table,
    CASE 
      WHEN d.client_id IS NOT NULL THEN 'Client'
      WHEN d.staff_id IS NOT NULL THEN 'Staff'
      WHEN d.form_id IS NOT NULL THEN 'Form'
      WHEN d.agreement_id IS NOT NULL THEN 'Agreement'
      WHEN d.care_plan_id IS NOT NULL THEN 'Care Plan'
      ELSE 'General'
    END as related_entity
  FROM public.documents d
  LEFT JOIN public.clients c ON d.client_id = c.id
  LEFT JOIN public.staff s ON d.staff_id = s.id
  WHERE d.branch_id = p_branch_id AND d.status = 'active'
  
  UNION ALL
  
  -- Get existing client documents for backward compatibility
  SELECT 
    cd.id,
    cd.name,
    cd.type,
    'Client Document'::TEXT as category,
    NULL::TEXT as description,
    cd.file_path,
    cd.file_size,
    NULL::TEXT as file_type,
    cd.uploaded_by as uploaded_by_name,
    CONCAT(c.first_name, ' ', c.last_name) as client_name,
    NULL::TEXT as staff_name,
    NULL::TEXT[] as tags,
    'active'::TEXT as status,
    cd.created_at,
    cd.updated_at,
    'client_documents'::TEXT as source_table,
    'Client'::TEXT as related_entity
  FROM public.client_documents cd
  LEFT JOIN public.clients c ON cd.client_id = c.id
  WHERE c.branch_id = p_branch_id
  
  UNION ALL
  
  -- Get agreement files
  SELECT 
    af.id,
    af.file_name as name,
    af.file_type as type,
    af.file_category as category,
    NULL::TEXT as description,
    af.storage_path as file_path,
    af.file_size::TEXT as file_size,
    af.file_type,
    NULL::TEXT as uploaded_by_name,
    NULL::TEXT as client_name,
    NULL::TEXT as staff_name,
    NULL::TEXT[] as tags,
    'active'::TEXT as status,
    af.created_at,
    af.updated_at,
    'agreement_files'::TEXT as source_table,
    'Agreement'::TEXT as related_entity
  FROM public.agreement_files af
  LEFT JOIN public.agreements a ON af.agreement_id = a.id
  WHERE a.branch_id = p_branch_id
  
  ORDER BY created_at DESC;
END;
$$;
