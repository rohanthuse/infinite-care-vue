-- Drop the existing function
DROP FUNCTION IF EXISTS get_branch_documents(UUID);

-- Recreate the function with correct column references
CREATE OR REPLACE FUNCTION get_branch_documents(p_branch_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  type TEXT,
  category TEXT,
  description TEXT,
  file_path TEXT,
  file_size BIGINT,
  file_type TEXT,
  uploaded_by_name TEXT,
  client_id UUID,
  client_name TEXT,
  staff_id UUID,
  staff_name TEXT,
  tags TEXT[],
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  source_table TEXT,
  related_entity TEXT,
  has_file BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  -- Get documents from main documents table
  SELECT 
    d.id,
    d.name,
    d.type,
    d.category,
    d.description,
    d.file_path,
    d.file_size,
    d.file_type,
    p.full_name as uploaded_by_name,
    d.client_id,
    CASE 
      WHEN d.client_id IS NOT NULL THEN c.first_name || ' ' || c.last_name
      ELSE NULL
    END as client_name,
    d.staff_id,
    CASE 
      WHEN d.staff_id IS NOT NULL THEN s.first_name || ' ' || s.last_name
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
      ELSE 'Branch'
    END::TEXT as related_entity,
    (d.file_path IS NOT NULL AND d.file_path != '')::BOOLEAN as has_file
  FROM public.documents d
  LEFT JOIN public.profiles p ON d.uploaded_by = p.id
  LEFT JOIN public.clients c ON d.client_id = c.id
  LEFT JOIN public.staff s ON d.staff_id = s.id
  WHERE d.branch_id = p_branch_id
  
  UNION ALL
  
  -- Get client documents from client_documents table
  SELECT 
    cd.id,
    cd.name,
    cd.type,
    NULL::TEXT as category,
    NULL::TEXT as description,
    cd.file_path,
    cd.file_size,
    NULL::TEXT as file_type,
    cd.uploaded_by as uploaded_by_name,
    cd.client_id,
    c.first_name || ' ' || c.last_name as client_name,
    NULL::UUID as staff_id,
    NULL::TEXT as staff_name,
    NULL::TEXT[] as tags,
    'active'::TEXT as status,
    cd.created_at,
    cd.updated_at,
    'client_documents'::TEXT as source_table,
    'Client'::TEXT as related_entity,
    (cd.file_path IS NOT NULL AND cd.file_path != '')::BOOLEAN as has_file
  FROM public.client_documents cd
  LEFT JOIN public.clients c ON cd.client_id = c.id
  WHERE c.branch_id = p_branch_id
  
  UNION ALL
  
  -- Get staff documents from staff_documents table
  SELECT 
    sd.id,
    COALESCE(sd.file_name, sd.document_type) as name,
    sd.document_type as type,
    'Staff Document'::TEXT as category,
    sd.description,
    'staff-documents/' || sd.file_path as file_path,
    sd.file_size,
    NULL::TEXT as file_type,
    s.first_name || ' ' || s.last_name as uploaded_by_name,
    NULL::UUID as client_id,
    NULL::TEXT as client_name,
    sd.staff_id,
    s.first_name || ' ' || s.last_name as staff_name,
    NULL::TEXT[] as tags,
    sd.status,
    sd.created_at,
    sd.updated_at,
    'staff_documents'::TEXT as source_table,
    'Staff'::TEXT as related_entity,
    (sd.file_path IS NOT NULL AND sd.file_path != '')::BOOLEAN as has_file
  FROM public.staff_documents sd
  LEFT JOIN public.staff s ON sd.staff_id = s.id
  WHERE s.branch_id = p_branch_id
  
  UNION ALL
  
  -- Get agreement files
  SELECT 
    af.id,
    af.file_name as name,
    af.file_type as type,
    af.file_category as category,
    NULL::TEXT as description,
    af.storage_path as file_path,
    af.file_size,
    af.file_type,
    p.full_name as uploaded_by_name,
    NULL::UUID as client_id,
    NULL::TEXT as client_name,
    NULL::UUID as staff_id,
    NULL::TEXT as staff_name,
    NULL::TEXT[] as tags,
    'active'::TEXT as status,
    af.created_at,
    af.updated_at,
    'agreement_files'::TEXT as source_table,
    'Agreement'::TEXT as related_entity,
    (af.storage_path IS NOT NULL AND af.storage_path != '')::BOOLEAN as has_file
  FROM public.agreement_files af
  LEFT JOIN public.profiles p ON af.uploaded_by = p.id
  LEFT JOIN public.agreements a ON af.agreement_id = a.id
  WHERE a.branch_id = p_branch_id
  
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;