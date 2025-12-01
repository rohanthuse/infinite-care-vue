-- Update get_optimized_tenant_data function to handle legacy subscription plan names
-- Adds fallback logic to map legacy plan names to user limits

DROP FUNCTION IF EXISTS get_optimized_tenant_data();

CREATE OR REPLACE FUNCTION get_optimized_tenant_data()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  contact_email text,
  contact_phone text,
  subscription_plan text,
  subscription_status text,
  subscription_expires_at timestamptz,
  settings jsonb,
  created_at timestamptz,
  total_users bigint,
  active_users bigint,
  super_admin_first_name text,
  super_admin_last_name text,
  super_admin_email text,
  plan_max_users integer,
  plan_price_monthly numeric,
  plan_price_yearly numeric,
  total_branches bigint,
  total_clients bigint,
  active_clients bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_counts AS (
    SELECT 
      suo.organization_id,
      COUNT(DISTINCT suo.system_user_id) as total_users,
      COUNT(DISTINCT CASE 
        WHEN su.is_active = true 
        AND EXISTS (
          SELECT 1 FROM system_sessions ss 
          WHERE ss.user_id = suo.system_user_id 
          AND ss.last_activity_at > NOW() - INTERVAL '30 days'
        )
        THEN suo.system_user_id 
      END) as active_users
    FROM system_user_organizations suo
    INNER JOIN system_users su ON suo.system_user_id = su.id
    GROUP BY suo.organization_id
  ),
  super_admins AS (
    SELECT DISTINCT ON (suo.organization_id)
      suo.organization_id,
      su.first_name,
      su.last_name,
      su.email
    FROM system_user_organizations suo
    INNER JOIN system_users su ON suo.system_user_id = su.id
    WHERE suo.role = 'super_admin'
    ORDER BY suo.organization_id, suo.created_at ASC
  ),
  branch_counts AS (
    SELECT 
      organization_id,
      COUNT(*) as total_branches
    FROM branches
    GROUP BY organization_id
  ),
  client_counts AS (
    SELECT 
      organization_id,
      COUNT(*) as total_clients,
      COUNT(*) FILTER (WHERE status = 'active') as active_clients
    FROM clients
    GROUP BY organization_id
  )
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
    COALESCE(uc.total_users, 0) as total_users,
    COALESCE(uc.active_users, 0) as active_users,
    sa.first_name as super_admin_first_name,
    sa.last_name as super_admin_last_name,
    sa.email as super_admin_email,
    COALESCE(
      sp.max_users,
      CASE 
        WHEN LOWER(o.subscription_plan) = 'basic' THEN 50
        WHEN LOWER(o.subscription_plan) = 'professional' THEN 150
        WHEN LOWER(o.subscription_plan) = 'enterprise' THEN 500
        WHEN LOWER(o.subscription_plan) = 'free' THEN 10
        WHEN o.subscription_plan = '0-10' THEN 10
        WHEN o.subscription_plan = '11-25' THEN 25
        WHEN o.subscription_plan = '26-50' THEN 50
        WHEN o.subscription_plan = '51-100' THEN 100
        WHEN o.subscription_plan = '101-250' THEN 250
        WHEN o.subscription_plan = '251-500' THEN 500
        WHEN o.subscription_plan = '500+' THEN 999999
        ELSE 50
      END
    ) as plan_max_users,
    sp.price_monthly as plan_price_monthly,
    sp.price_yearly as plan_price_yearly,
    COALESCE(bc.total_branches, 0) as total_branches,
    COALESCE(cc.total_clients, 0) as total_clients,
    COALESCE(cc.active_clients, 0) as active_clients
  FROM organizations o
  LEFT JOIN user_counts uc ON o.id = uc.organization_id
  LEFT JOIN super_admins sa ON o.id = sa.organization_id
  LEFT JOIN subscription_plans sp ON (
    o.subscription_plan_id = sp.id OR 
    (o.subscription_plan_id IS NULL AND o.subscription_plan = sp.name)
  )
  LEFT JOIN branch_counts bc ON o.id = bc.organization_id
  LEFT JOIN client_counts cc ON o.id = cc.organization_id
  ORDER BY o.created_at DESC;
END;
$$;