-- Update get_user_organization_id function to use role-based priority
CREATE OR REPLACE FUNCTION public.get_user_organization_id(user_id_param uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  WITH prioritized_memberships AS (
    -- Get organization with role-based priority: owner > admin > member, then most recent
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = user_id_param AND status = 'active'
    ORDER BY 
      CASE role
        WHEN 'owner' THEN 1
        WHEN 'admin' THEN 2  
        WHEN 'member' THEN 3
        ELSE 999
      END,
      joined_at DESC
    LIMIT 1
  ),
  client_org AS (
    -- Get organization from client through branch
    SELECT b.organization_id
    FROM public.clients c
    JOIN public.branches b ON c.branch_id = b.id
    WHERE c.auth_user_id = user_id_param
    LIMIT 1
  ),
  staff_org AS (
    -- Get organization from staff through branch
    SELECT b.organization_id
    FROM public.staff s
    JOIN public.branches b ON s.branch_id = b.id
    WHERE s.id = user_id_param OR s.auth_user_id = user_id_param
    LIMIT 1
  )
  SELECT organization_id FROM prioritized_memberships WHERE organization_id IS NOT NULL
  UNION ALL
  SELECT organization_id FROM client_org WHERE organization_id IS NOT NULL
  UNION ALL
  SELECT organization_id FROM staff_org WHERE organization_id IS NOT NULL
  LIMIT 1;
$function$