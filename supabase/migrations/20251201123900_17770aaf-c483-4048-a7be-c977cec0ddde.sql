-- Create RPC function to get comprehensive system analytics
CREATE OR REPLACE FUNCTION get_system_analytics()
RETURNS JSON AS $$
DECLARE
  result JSON;
  total_tenants INT;
  total_users INT;
  monthly_revenue NUMERIC;
  yearly_revenue NUMERIC;
  monthly_count INT;
  yearly_count INT;
  demo_total INT;
  demo_pending INT;
  demo_approved INT;
  demo_rejected INT;
  recent_activity_count INT;
  subscription_distribution JSON;
  tenant_growth JSON;
BEGIN
  -- Get total tenants
  SELECT COUNT(*) INTO total_tenants FROM organizations WHERE status = 'active';
  
  -- Get total users
  SELECT COUNT(*) INTO total_users FROM profiles;
  
  -- Get billing cycle breakdown with revenue
  SELECT 
    COUNT(*) FILTER (WHERE billing_cycle = 'monthly') INTO monthly_count
  FROM organizations WHERE status = 'active';
  
  SELECT 
    COUNT(*) FILTER (WHERE billing_cycle = 'yearly') INTO yearly_count
  FROM organizations WHERE status = 'active';
  
  SELECT 
    COALESCE(SUM(CASE WHEN o.billing_cycle = 'monthly' THEN sp.price_monthly ELSE 0 END), 0) INTO monthly_revenue
  FROM organizations o
  LEFT JOIN subscription_plans sp ON o.subscription_plan = sp.id
  WHERE o.status = 'active';
  
  SELECT 
    COALESCE(SUM(CASE WHEN o.billing_cycle = 'yearly' THEN sp.price_yearly ELSE 0 END), 0) INTO yearly_revenue
  FROM organizations o
  LEFT JOIN subscription_plans sp ON o.subscription_plan = sp.id
  WHERE o.status = 'active';
  
  -- Get subscription plan distribution
  SELECT JSON_AGG(plan_data) INTO subscription_distribution
  FROM (
    SELECT 
      COALESCE(sp.name, 'No Plan') as plan_name,
      COUNT(o.id) as tenant_count,
      sp.id as plan_id
    FROM organizations o
    LEFT JOIN subscription_plans sp ON o.subscription_plan = sp.id
    WHERE o.status = 'active'
    GROUP BY sp.id, sp.name
    ORDER BY tenant_count DESC
  ) plan_data;
  
  -- Get tenant growth for last 12 months
  SELECT JSON_AGG(growth_data ORDER BY month) INTO tenant_growth
  FROM (
    SELECT 
      TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
      DATE_TRUNC('month', created_at) as month_date,
      COUNT(*) as count
    FROM organizations
    WHERE created_at >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY DATE_TRUNC('month', created_at)
  ) growth_data;
  
  -- Get demo request stats
  SELECT COUNT(*) INTO demo_total FROM demo_requests;
  SELECT COUNT(*) FILTER (WHERE status = 'pending') INTO demo_pending FROM demo_requests;
  SELECT COUNT(*) FILTER (WHERE status = 'approved') INTO demo_approved FROM demo_requests;
  SELECT COUNT(*) FILTER (WHERE status = 'rejected') INTO demo_rejected FROM demo_requests;
  
  -- Get recent activity count (last 30 days)
  SELECT COUNT(*) INTO recent_activity_count 
  FROM system_audit_logs 
  WHERE created_at >= NOW() - INTERVAL '30 days';
  
  -- Build result JSON
  result := JSON_BUILD_OBJECT(
    'total_tenants', total_tenants,
    'total_users', total_users,
    'monthly_revenue', monthly_revenue,
    'yearly_revenue', yearly_revenue,
    'monthly_count', monthly_count,
    'yearly_count', yearly_count,
    'total_revenue', monthly_revenue + yearly_revenue,
    'demo_requests', JSON_BUILD_OBJECT(
      'total', demo_total,
      'pending', demo_pending,
      'approved', demo_approved,
      'rejected', demo_rejected
    ),
    'recent_activity_count', recent_activity_count,
    'subscription_distribution', COALESCE(subscription_distribution, '[]'::JSON),
    'tenant_growth', COALESCE(tenant_growth, '[]'::JSON)
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;