-- Drop the existing function first
DROP FUNCTION IF EXISTS get_system_notifications(uuid);

-- Recreate with broadcast support for demo_request notifications
CREATE OR REPLACE FUNCTION get_system_notifications(p_user_id uuid DEFAULT NULL)
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
    n.type::text,
    n.category::text,
    n.priority::text,
    n.title,
    n.message,
    n.data,
    n.read_at,
    n.created_at,
    n.updated_at
  FROM notifications n
  WHERE 
    -- For demo_request type, show ALL notifications to any system admin (broadcast)
    (n.type = 'demo_request')
    OR
    -- For other notification types, filter by specific user_id
    (n.type != 'demo_request' AND n.user_id = COALESCE(p_user_id, auth.uid()))
  ORDER BY n.created_at DESC
  LIMIT 100;
END;
$$;