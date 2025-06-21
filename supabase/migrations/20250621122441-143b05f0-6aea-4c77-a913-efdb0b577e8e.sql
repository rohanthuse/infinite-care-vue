
-- Update the get_branch_documents function to handle cross-bucket file paths consistently
CREATE OR REPLACE FUNCTION public.get_branch_documents(p_branch_id uuid)
 RETURNS TABLE(id uuid, name text, type text, category text, description text, file_path text, file_size text, file_type text, uploaded_by_name text, client_name text, staff_name text, tags text[], status text, created_at timestamp with time zone, updated_at timestamp with time zone, source_table text, related_entity text)
 LANGUAGE plpgsql
AS $function$
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
  
  -- Get existing client documents for backward compatibility with consistent bucket prefixing
  SELECT 
    cd.id,
    cd.name,
    cd.type,
    'Client Document'::TEXT as category,
    NULL::TEXT as description,
    -- Always prefix client document paths with 'client-documents/' regardless of current format
    CASE 
      WHEN cd.file_path IS NOT NULL AND cd.file_path != '' THEN
        CASE
          WHEN cd.file_path LIKE 'client-documents/%' THEN cd.file_path
          ELSE 'client-documents/' || cd.file_path
        END
      ELSE cd.file_path
    END as file_path,
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
  
  -- Get agreement files with consistent bucket prefixing
  SELECT 
    af.id,
    af.file_name as name,
    af.file_type as type,
    af.file_category as category,
    NULL::TEXT as description,
    -- Always prefix agreement file paths with 'agreement-files/' regardless of current format
    CASE 
      WHEN af.storage_path IS NOT NULL AND af.storage_path != '' THEN
        CASE
          WHEN af.storage_path LIKE 'agreement-files/%' THEN af.storage_path
          ELSE 'agreement-files/' || af.storage_path
        END
      ELSE af.storage_path
    END as file_path,
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
$function$;
