-- Fix client organization_id based on their branch
UPDATE public.clients 
SET organization_id = b.organization_id
FROM public.branches b
WHERE clients.branch_id = b.id 
AND clients.organization_id IS NULL;

-- Fix message participants to use auth user IDs instead of database client IDs
-- First, let's run the existing function to fix client message participants
SELECT fix_client_message_participants();

-- Update get_user_organization_id function to handle clients properly
CREATE OR REPLACE FUNCTION public.get_user_organization_id(user_id_param uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  -- First try to get organization from organization_members
  SELECT organization_id 
  FROM public.organization_members 
  WHERE user_id = user_id_param AND status = 'active' 
  UNION
  -- Then try to get organization from client through branch
  SELECT b.organization_id
  FROM public.clients c
  JOIN public.branches b ON c.branch_id = b.id
  WHERE c.auth_user_id = user_id_param
  UNION
  -- Then try to get organization from staff through branch
  SELECT b.organization_id
  FROM public.staff s
  JOIN public.branches b ON s.branch_id = b.id
  WHERE s.id = user_id_param OR s.auth_user_id = user_id_param
  LIMIT 1;
$function$;

-- Ensure clients can access their message threads
CREATE OR REPLACE FUNCTION public.client_can_access_thread(thread_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
BEGIN
  -- Check if user is a participant in the thread OR is a client in the same organization
  RETURN EXISTS (
    SELECT 1 FROM public.message_participants 
    WHERE thread_id = thread_id_param 
    AND user_id = user_id_param
  ) OR EXISTS (
    SELECT 1 FROM public.message_threads mt
    JOIN public.clients c ON c.auth_user_id = user_id_param
    JOIN public.branches b ON c.branch_id = b.id
    WHERE mt.id = thread_id_param 
    AND mt.organization_id = b.organization_id
  );
END;
$function$;

-- Update message_threads RLS policy to include client access
DROP POLICY IF EXISTS "Organization members can manage message threads" ON public.message_threads;

CREATE POLICY "Organization members can manage message threads"
ON public.message_threads
FOR ALL
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  OR user_is_admin(auth.uid())
  OR client_can_access_thread(id, auth.uid())
)
WITH CHECK (
  organization_id = get_user_organization_id(auth.uid()) 
  OR user_is_admin(auth.uid())
  OR client_can_access_thread(id, auth.uid())
);