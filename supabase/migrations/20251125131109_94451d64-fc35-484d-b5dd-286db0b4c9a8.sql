-- Drop the existing function
DROP FUNCTION IF EXISTS get_branch_documents(uuid);

-- Recreate the function with corrected column references
CREATE OR REPLACE FUNCTION get_branch_documents(p_branch_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  type text,
  size bigint,
  uploaded_at timestamptz,
  uploaded_by uuid,
  uploaded_by_name text,
  storage_path text,
  category text,
  related_entity text,
  related_entity_id uuid,
  status text
) AS $$
BEGIN
  RETURN QUERY
  -- Documents table
  SELECT 
    d.id,
    d.document_name as name,
    d.document_type as type,
    d.file_size as size,
    d.uploaded_at,
    d.uploaded_by,
    COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '') as uploaded_by_name,
    d.storage_path,
    d.category,
    'General'::text as related_entity,
    NULL::uuid as related_entity_id,
    d.status
  FROM documents d
  LEFT JOIN profiles p ON d.uploaded_by = p.id
  WHERE d.branch_id = p_branch_id
  
  UNION ALL
  
  -- Client documents
  SELECT 
    cd.id,
    cd.name,
    cd.type,
    cd.size,
    cd.uploaded_at,
    cd.uploaded_by,
    COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '') as uploaded_by_name,
    cd.storage_path,
    'Client Document'::text as category,
    'Client'::text as related_entity,
    cd.client_id as related_entity_id,
    'active'::text as status
  FROM client_documents cd
  LEFT JOIN profiles p ON cd.uploaded_by = p.id
  LEFT JOIN clients c ON cd.client_id = c.id
  WHERE c.branch_id = p_branch_id
  
  UNION ALL
  
  -- Staff documents
  SELECT 
    sd.id,
    sd.document_name as name,
    sd.document_type as type,
    sd.file_size as size,
    sd.uploaded_at,
    sd.uploaded_by,
    COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '') as uploaded_by_name,
    sd.storage_path,
    sd.category,
    'Staff'::text as related_entity,
    sd.staff_id as related_entity_id,
    sd.status
  FROM staff_documents sd
  LEFT JOIN profiles p ON sd.uploaded_by = p.id
  LEFT JOIN staff s ON sd.staff_id = s.id
  WHERE s.branch_id = p_branch_id
  
  UNION ALL
  
  -- Agreement files
  SELECT 
    af.id,
    af.file_name as name,
    af.file_type as type,
    af.file_size as size,
    af.created_at as uploaded_at,
    af.uploaded_by,
    COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '') as uploaded_by_name,
    af.storage_path,
    af.file_category as category,
    'Agreement'::text as related_entity,
    af.agreement_id as related_entity_id,
    'active'::text as status
  FROM agreement_files af
  LEFT JOIN profiles p ON af.uploaded_by = p.id
  LEFT JOIN agreements a ON af.agreement_id = a.id
  WHERE a.branch_id = p_branch_id
  
  ORDER BY uploaded_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;