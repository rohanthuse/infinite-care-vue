-- Drop the existing function that references non-existent system_subscriptions table
DROP FUNCTION IF EXISTS get_optimized_tenant_data();

-- Recreate the function with correct table references and all required fields
CREATE OR REPLACE FUNCTION get_optimized_tenant_data()
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  subscription_plan TEXT,
  subscription_status TEXT,
  subscription_expires_at TIMESTAMPTZ,
  settings JSONB,
  created_at TIMESTAMPTZ,
  total_users BIGINT,
  active_users BIGINT,
  super_admin_first_name TEXT,
  super_admin_last_name TEXT,
  super_admin_email TEXT,
  plan_max_users INTEGER,
  plan_price_monthly NUMERIC,
  plan_price_yearly NUMERIC,
  total_branches BIGINT,
  total_clients BIGINT,
  active_clients BIGINT,
  has_agreement BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.name,
    o.slug,
    o.contact_email,
    o.contact_phone,
    o.subscription_plan,
    o.subscription_status,
    o.subscription_expires_at,
    o.settings,
    o.created_at,
    COALESCE(user_counts.total_users, 0) AS total_users,
    COALESCE(user_counts.active_users, 0) AS active_users,
    user_counts.super_admin_first_name,
    user_counts.super_admin_last_name,
    user_counts.super_admin_email,
    sp.max_users AS plan_max_users,
    sp.price_monthly AS plan_price_monthly,
    sp.price_yearly AS plan_price_yearly,
    COALESCE(branch_counts.total_branches, 0) AS total_branches,
    COALESCE(client_counts.total_clients, 0) AS total_clients,
    COALESCE(client_counts.active_clients, 0) AS active_clients,
    COALESCE(agreement_check.has_agreement, false) AS has_agreement
  FROM organizations o
  -- Join with subscription plans to get plan details
  LEFT JOIN subscription_plans sp ON sp.name = o.subscription_plan
  -- Calculate user counts per organization
  LEFT JOIN LATERAL (
    SELECT
      COUNT(DISTINCT suo.system_user_id) AS total_users,
      COUNT(DISTINCT CASE 
        WHEN su.is_active = true 
        AND EXISTS (
          SELECT 1 FROM system_sessions ss 
          WHERE ss.system_user_id = suo.system_user_id 
          AND ss.last_activity_at > NOW() - INTERVAL '30 days'
        )
        THEN suo.system_user_id 
        ELSE NULL 
      END) AS active_users,
      MAX(CASE WHEN suo.role = 'super_admin' THEN su.first_name END) AS super_admin_first_name,
      MAX(CASE WHEN suo.role = 'super_admin' THEN su.last_name END) AS super_admin_last_name,
      MAX(CASE WHEN suo.role = 'super_admin' THEN su.email END) AS super_admin_email
    FROM system_user_organizations suo
    LEFT JOIN system_users su ON su.id = suo.system_user_id
    WHERE suo.organization_id = o.id
  ) AS user_counts ON true
  -- Count branches for this organization
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS total_branches
    FROM branches b
    WHERE b.organization_id = o.id
  ) AS branch_counts ON true
  -- Count clients for this organization
  LEFT JOIN LATERAL (
    SELECT 
      COUNT(*) AS total_clients,
      COUNT(CASE WHEN c.status = 'Active' THEN 1 ELSE NULL END) AS active_clients
    FROM clients c
    WHERE c.organization_id = o.id
  ) AS client_counts ON true
  -- Check if organization has any agreements
  LEFT JOIN LATERAL (
    SELECT EXISTS (
      SELECT 1 FROM system_tenant_agreements sta
      WHERE sta.tenant_id = o.id
    ) AS has_agreement
  ) AS agreement_check ON true
  ORDER BY o.created_at DESC;
END;
$$;