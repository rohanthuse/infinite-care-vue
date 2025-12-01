-- Fix get_system_notifications to use auth_user_id instead of id
-- This ensures demo request notifications appear in the System Dashboard notification icon

CREATE OR REPLACE FUNCTION public.get_system_notifications(p_system_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  type text,
  category text,
  priority text,
  title text,
  message text,
  data jsonb,
  read_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.user_id,
    n.type,
    n.category,
    n.priority,
    n.title,
    n.message,
    n.data,
    n.read_at,
    n.created_at,
    n.updated_at
  FROM notifications n
  INNER JOIN system_users su ON n.user_id = su.auth_user_id
  WHERE su.auth_user_id = p_system_user_id
  AND su.is_active = true
  AND n.type IN ('demo_request', 'system')
  ORDER BY n.created_at DESC
  LIMIT 50;
END;
$$;