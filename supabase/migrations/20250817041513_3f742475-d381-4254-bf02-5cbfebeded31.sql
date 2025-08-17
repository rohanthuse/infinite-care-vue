-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_optimized_tenant_data();

-- Create function to get tenant data with proper active user counts
CREATE OR REPLACE FUNCTION public.get_optimized_tenant_data()
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  contact_email text,
  contact_phone text,
  subscription_status text,
  subscription_plan text,
  created_at timestamp with time zone,
  total_users bigint,
  active_users bigint,
  recent_activity_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH org_user_counts AS (
    SELECT 
      o.id as org_id,
      COUNT(DISTINCT suo.system_user_id) as total_users,
      COUNT(DISTINCT CASE 
        WHEN ss.last_activity_at > NOW() - INTERVAL '30 days' 
        THEN suo.system_user_id 
      END) as active_users,
      COUNT(DISTINCT CASE 
        WHEN ss.last_activity_at > NOW() - INTERVAL '7 days' 
        THEN suo.system_user_id 
      END) as recent_activity_count
    FROM organizations o
    LEFT JOIN system_user_organizations suo ON o.id = suo.organization_id
    LEFT JOIN system_users su ON suo.system_user_id = su.id AND su.is_active = true
    LEFT JOIN system_sessions ss ON su.id = ss.system_user_id AND ss.is_active = true
    GROUP BY o.id
  )
  SELECT 
    o.id,
    o.name,
    o.slug,
    o.contact_email,
    o.contact_phone,
    o.subscription_status,
    o.subscription_plan,
    o.created_at,
    COALESCE(ouc.total_users, 0) as total_users,
    COALESCE(ouc.active_users, 0) as active_users,
    COALESCE(ouc.recent_activity_count, 0) as recent_activity_count
  FROM organizations o
  LEFT JOIN org_user_counts ouc ON o.id = ouc.org_id
  ORDER BY o.created_at DESC;
END;
$$;