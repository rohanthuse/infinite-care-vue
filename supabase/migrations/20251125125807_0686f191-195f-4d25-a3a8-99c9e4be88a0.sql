-- Drop and recreate get_branch_documents RPC to include staff_documents table

DROP FUNCTION IF EXISTS get_branch_documents(UUID);

CREATE OR REPLACE FUNCTION get_branch_documents(p_branch_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  type TEXT,
  category TEXT,
  description TEXT,
  file_path TEXT,
  file_size TEXT,
  file_type TEXT,
  uploaded_by_name TEXT,
  client_id UUID,
  client_name TEXT,
  staff_id UUID,
  staff_name TEXT,
  tags TEXT[],
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
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
    d.uploaded_by_name,
    d.client_id,
    c.first_name || ' ' || c.last_name as client_name,
    d.staff_id,
    s.first_name || ' ' || s.last_name as staff_name,
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
  LEFT JOIN public.clients c ON d.client_id = c.id
  LEFT JOIN public.staff s ON d.staff_id = s.id
  WHERE d.branch_id = p_branch_id
  
  UNION ALL
  
  -- Get client documents from client_documents table
  SELECT 
    cd.id,
    cd.document_name as name,
    cd.document_type as type,
    cd.category,
    cd.notes as description,
    cd.file_path,
    cd.file_size,
    cd.file_type,
    cd.uploaded_by_name,
    cd.client_id,
    c.first_name || ' ' || c.last_name as client_name,
    NULL::UUID as staff_id,
    NULL::TEXT as staff_name,
    cd.tags,
    COALESCE(cd.status, 'active')::TEXT as status,
    cd.created_at,
    cd.updated_at,
    'client_documents'::TEXT as source_table,
    'Client'::TEXT as related_entity,
    (cd.file_path IS NOT NULL AND cd.file_path != '')::BOOLEAN as has_file
  FROM public.client_documents cd
  LEFT JOIN public.clients c ON cd.client_id = c.id
  WHERE c.branch_id = p_branch_id
  
  UNION ALL
  
  -- Get agreement files from agreement_files table
  SELECT 
    af.id,
    af.file_name as name,
    af.file_category as type,
    'Agreement File'::TEXT as category,
    NULL::TEXT as description,
    af.storage_path as file_path,
    af.file_size::TEXT as file_size,
    af.file_type,
    p.first_name || ' ' || p.last_name as uploaded_by_name,
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
  LEFT JOIN public.agreements a ON af.agreement_id = a.id
  LEFT JOIN public.profiles p ON af.uploaded_by = p.id
  WHERE a.branch_id = p_branch_id
  
  UNION ALL
  
  -- Get staff documents uploaded by carers
  SELECT 
    sd.id,
    COALESCE(sd.file_name, sd.document_type) as name,
    sd.document_type as type,
    'Staff Document'::TEXT as category,
    sd.description,
    -- Prefix with 'staff-documents/' for correct bucket access
    CASE 
      WHEN sd.file_path IS NOT NULL AND sd.file_path != '' THEN
        CASE
          WHEN sd.file_path LIKE 'staff-documents/%' THEN sd.file_path
          ELSE 'staff-documents/' || sd.file_path
        END
      ELSE sd.file_path
    END as file_path,
    sd.file_size,
    NULL::TEXT as file_type,
    s.first_name || ' ' || s.last_name as uploaded_by_name,
    NULL::UUID as client_id,
    NULL::TEXT as client_name,
    sd.staff_id,
    s.first_name || ' ' || s.last_name as staff_name,
    NULL::TEXT[] as tags,
    COALESCE(sd.status, 'active')::TEXT as status,
    sd.created_at,
    sd.updated_at,
    'staff_documents'::TEXT as source_table,
    'Staff'::TEXT as related_entity,
    (sd.file_path IS NOT NULL AND sd.file_path != '')::BOOLEAN as has_file
  FROM public.staff_documents sd
  INNER JOIN public.staff s ON sd.staff_id = s.id
  WHERE s.branch_id = p_branch_id;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;