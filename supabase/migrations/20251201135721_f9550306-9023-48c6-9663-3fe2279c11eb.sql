-- Fix column reference bug in get_optimized_tenant_data function
-- Drop and recreate to fix return type

DROP FUNCTION IF EXISTS get_optimized_tenant_data();

CREATE OR REPLACE FUNCTION get_optimized_tenant_data()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  phone text,
  address text,
  status text,
  subscription_type text,
  subscription_status text,
  user_count bigint,
  active_users bigint,
  has_agreement boolean
) AS $$
BEGIN
  RETURN QUERY
  WITH agreement_check AS (
    SELECT DISTINCT tenant_id, true as has_agreement
    FROM system_tenant_agreements
  ),
  user_counts AS (
    SELECT 
      ss.tenant_id,
      COUNT(DISTINCT ss.system_user_id) as total_users,
      COUNT(DISTINCT CASE 
        WHEN ss.last_login_at > NOW() - INTERVAL '30 days' 
        THEN ss.system_user_id 
      END) as active_user_count
    FROM system_subscriptions ss
    WHERE ss.system_user_id IS NOT NULL
    GROUP BY ss.tenant_id
  )
  SELECT 
    o.id,
    o.name,
    o.email,
    o.phone,
    o.address,
    o.status,
    COALESCE(ss.subscription_type, 'none') as subscription_type,
    COALESCE(ss.subscription_status, 'none') as subscription_status,
    COALESCE(uc.total_users, 0) as user_count,
    COALESCE(uc.active_user_count, 0) as active_users,
    COALESCE(ac.has_agreement, false) as has_agreement
  FROM organizations o
  LEFT JOIN system_subscriptions ss ON o.id = ss.tenant_id
  LEFT JOIN user_counts uc ON o.id = uc.tenant_id
  LEFT JOIN agreement_check ac ON o.id = ac.tenant_id
  WHERE o.is_tenant = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;