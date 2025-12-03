-- Update get_branch_documents to exclude client_documents and staff_documents
-- Admin Documents module should only show admin-uploaded documents and agreement files

CREATE OR REPLACE FUNCTION public.get_branch_documents(p_branch_id uuid)
RETURNS TABLE(
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
  status text,
  source_table text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  -- Documents table (Admin uploads ONLY - excludes client/staff self-uploads)
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
    d.status,
    'documents'::text as source_table
  FROM public.documents d
  WHERE d.branch_id = p_branch_id
  
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
    'active'::text as status,
    'agreement_files'::text as source_table
  FROM public.agreement_files af
  LEFT JOIN public.profiles p ON af.uploaded_by = p.id
  LEFT JOIN public.agreements a ON af.agreement_id = a.id
  WHERE a.branch_id = p_branch_id
  
  ORDER BY uploaded_at DESC;
END;
$function$;