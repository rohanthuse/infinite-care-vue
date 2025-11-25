-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_branch_documents(uuid);

-- Recreate with CORRECT column names and return type
CREATE OR REPLACE FUNCTION public.get_branch_documents(p_branch_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  type text,
  size text,
  uploaded_at timestamp with time zone,
  uploaded_by uuid,
  uploaded_by_name text,
  storage_path text,
  category text,
  related_entity text,
  related_entity_id uuid,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- Documents table
  SELECT 
    d.id,
    d.name,
    d.type,
    d.file_size as size,
    d.created_at as uploaded_at,
    d.uploaded_by,
    COALESCE(d.uploaded_by_name, '') as uploaded_by_name,
    d.file_path as storage_path,
    d.category,
    CASE 
      WHEN d.client_id IS NOT NULL THEN 'Client'::text
      WHEN d.staff_id IS NOT NULL THEN 'Staff'::text
      ELSE 'General'::text
    END as related_entity,
    COALESCE(d.client_id, d.staff_id) as related_entity_id,
    d.status
  FROM public.documents d
  WHERE d.branch_id = p_branch_id
  
  UNION ALL
  
  -- Client Documents table
  SELECT 
    cd.id,
    cd.name,
    cd.type,
    cd.file_size as size,
    cd.created_at as uploaded_at,
    NULL::uuid as uploaded_by,
    COALESCE(cd.uploaded_by, '') as uploaded_by_name,
    cd.file_path as storage_path,
    'Client Document'::text as category,
    'Client'::text as related_entity,
    cd.client_id as related_entity_id,
    'active'::text as status
  FROM public.client_documents cd
  LEFT JOIN public.clients c ON cd.client_id = c.id
  WHERE c.branch_id = p_branch_id
  
  UNION ALL
  
  -- Staff Documents table
  SELECT 
    sd.id,
    sd.file_name as name,
    sd.document_type as type,
    sd.file_size as size,
    sd.created_at as uploaded_at,
    NULL::uuid as uploaded_by,
    ''::text as uploaded_by_name,
    sd.file_path as storage_path,
    COALESCE(sd.description, 'Staff Document')::text as category,
    'Staff'::text as related_entity,
    sd.staff_id as related_entity_id,
    sd.status
  FROM public.staff_documents sd
  LEFT JOIN public.staff s ON sd.staff_id = s.id
  WHERE s.branch_id = p_branch_id
  
  UNION ALL
  
  -- Agreement Files table
  SELECT 
    af.id,
    af.file_name as name,
    af.file_type as type,
    af.file_size::text as size,
    af.created_at as uploaded_at,
    af.uploaded_by,
    COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '') as uploaded_by_name,
    af.storage_path,
    af.file_category as category,
    'Agreement'::text as related_entity,
    af.agreement_id as related_entity_id,
    'active'::text as status
  FROM public.agreement_files af
  LEFT JOIN public.profiles p ON af.uploaded_by = p.id
  LEFT JOIN public.agreements a ON af.agreement_id = a.id
  WHERE a.branch_id = p_branch_id
  
  ORDER BY uploaded_at DESC;
END;
$$;