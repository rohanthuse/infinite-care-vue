-- Drop and recreate the get_optimized_tenant_data function with enhanced fields
DROP FUNCTION IF EXISTS get_optimized_tenant_data();

CREATE OR REPLACE FUNCTION get_optimized_tenant_data()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  subscription_plan text,
  subscription_status text,
  subscription_expires_at timestamp with time zone,
  contact_email text,
  settings jsonb,
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
  WITH super_admins AS (
    SELECT 
      suo.organization_id,
      su.first_name,
      su.last_name,
      su.email,
      ROW_NUMBER() OVER (PARTITION BY suo.organization_id ORDER BY suo.created_at ASC) as rn
    FROM system_user_organizations suo
    JOIN system_users su ON suo.user_id = su.id
    WHERE suo.role = 'super_admin' AND suo.status = 'active'
  ),
  branch_stats AS (
    SELECT 
      b.organization_id,
      COUNT(DISTINCT b.id) as branch_count
    FROM branches b
    GROUP BY b.organization_id
  ),
  client_stats AS (
    SELECT 
      b.organization_id,
      COUNT(c.id) as total_client_count,
      COUNT(c.id) FILTER (WHERE c.status = 'active') as active_client_count
    FROM clients c
    JOIN branches b ON c.branch_id = b.id
    GROUP BY b.organization_id
  )
  SELECT 
    o.id,
    o.name,
    o.slug,
    o.subscription_plan,
    o.subscription_status,
    o.subscription_expires_at,
    o.contact_email,
    o.settings,
    COUNT(DISTINCT suo.user_id) as total_users,
    COUNT(DISTINCT CASE WHEN suo.status = 'active' THEN suo.user_id END) as active_users,
    sa.first_name as super_admin_first_name,
    sa.last_name as super_admin_last_name,
    sa.email as super_admin_email,
    sp.max_users as plan_max_users,
    sp.price_monthly as plan_price_monthly,
    sp.price_yearly as plan_price_yearly,
    COALESCE(bs.branch_count, 0) as total_branches,
    COALESCE(cs.total_client_count, 0) as total_clients,
    COALESCE(cs.active_client_count, 0) as active_clients
  FROM organizations o
  LEFT JOIN system_user_organizations suo ON o.id = suo.organization_id
  LEFT JOIN super_admins sa ON o.id = sa.organization_id AND sa.rn = 1
  LEFT JOIN subscription_plans sp ON o.subscription_plan = sp.name
  LEFT JOIN branch_stats bs ON o.id = bs.organization_id
  LEFT JOIN client_stats cs ON o.id = cs.organization_id
  GROUP BY 
    o.id, 
    o.name, 
    o.slug, 
    o.subscription_plan, 
    o.subscription_status, 
    o.subscription_expires_at,
    o.contact_email,
    o.settings,
    sa.first_name,
    sa.last_name,
    sa.email,
    sp.max_users,
    sp.price_monthly,
    sp.price_yearly,
    bs.branch_count,
    cs.total_client_count,
    cs.active_client_count
  ORDER BY o.created_at DESC;
END;
$$;