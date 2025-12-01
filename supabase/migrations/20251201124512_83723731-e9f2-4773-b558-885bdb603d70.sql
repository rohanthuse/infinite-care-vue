-- Fix the get_system_analytics RPC function with correct column references
CREATE OR REPLACE FUNCTION public.get_system_analytics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_tenants INTEGER;
  total_users INTEGER;
  monthly_revenue NUMERIC;
  yearly_revenue NUMERIC;
  monthly_count INTEGER;
  yearly_count INTEGER;
  total_revenue NUMERIC;
  demo_stats JSON;
  recent_activity_count INTEGER;
  subscription_dist JSON;
  tenant_growth_data JSON;
  result JSON;
BEGIN
  -- Count active tenants (fix: use subscription_status instead of status)
  SELECT COUNT(*) INTO total_tenants 
  FROM public.organizations 
  WHERE subscription_status = 'active';
  
  -- Count total users
  SELECT COUNT(*) INTO total_users 
  FROM auth.users;
  
  -- Calculate monthly and yearly revenue from settings->>'total_amount'
  SELECT COALESCE(SUM((settings->>'total_amount')::numeric), 0) INTO monthly_revenue
  FROM public.organizations 
  WHERE subscription_status = 'active' 
  AND settings->>'billing_cycle' = 'monthly';
  
  SELECT COALESCE(SUM((settings->>'total_amount')::numeric), 0) INTO yearly_revenue
  FROM public.organizations 
  WHERE subscription_status = 'active' 
  AND settings->>'billing_cycle' = 'yearly';
  
  -- Count monthly and yearly billed organizations
  SELECT 
    COUNT(*) FILTER (WHERE settings->>'billing_cycle' = 'monthly') as monthly,
    COUNT(*) FILTER (WHERE settings->>'billing_cycle' = 'yearly') as yearly
  INTO monthly_count, yearly_count
  FROM public.organizations
  WHERE subscription_status = 'active';
  
  -- Calculate total revenue
  total_revenue := monthly_revenue + yearly_revenue;
  
  -- Get demo request statistics
  SELECT json_build_object(
    'total', COUNT(*),
    'pending', COUNT(*) FILTER (WHERE status = 'pending'),
    'approved', COUNT(*) FILTER (WHERE status = 'approved'),
    'rejected', COUNT(*) FILTER (WHERE status = 'rejected')
  ) INTO demo_stats
  FROM public.demo_requests;
  
  -- Get recent activity count (last 30 days)
  SELECT COUNT(*) INTO recent_activity_count
  FROM public.audit_logs
  WHERE created_at >= NOW() - INTERVAL '30 days';
  
  -- Get subscription distribution (handle both UUID-based and text-based plan references)
  SELECT COALESCE(json_agg(json_build_object(
    'plan_name', plan_name,
    'tenant_count', tenant_count,
    'plan_id', plan_id
  )), '[]'::json)
  INTO subscription_dist
  FROM (
    SELECT 
      COALESCE(sp.name, o.subscription_plan, 'No Plan') as plan_name,
      COUNT(o.id) as tenant_count,
      COALESCE(sp.id::text, 'legacy') as plan_id
    FROM public.organizations o
    LEFT JOIN public.subscription_plans sp ON (
      o.subscription_plan_id = sp.id OR o.subscription_plan = sp.name
    )
    WHERE o.subscription_status = 'active'
    GROUP BY sp.id, sp.name, o.subscription_plan
    ORDER BY tenant_count DESC
  ) sub;
  
  -- Get tenant growth over last 12 months
  SELECT COALESCE(json_agg(json_build_object(
    'month', month,
    'month_date', month_date,
    'count', count
  )), '[]'::json)
  INTO tenant_growth_data
  FROM (
    SELECT 
      TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
      DATE_TRUNC('month', created_at)::date as month_date,
      COUNT(*) as count
    FROM public.organizations
    WHERE created_at >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY DATE_TRUNC('month', created_at)
  ) growth;
  
  -- Build final result
  result := json_build_object(
    'total_tenants', total_tenants,
    'total_users', total_users,
    'monthly_revenue', monthly_revenue,
    'yearly_revenue', yearly_revenue,
    'monthly_count', monthly_count,
    'yearly_count', yearly_count,
    'total_revenue', total_revenue,
    'demo_requests', demo_stats,
    'recent_activity_count', recent_activity_count,
    'subscription_distribution', subscription_dist,
    'tenant_growth', tenant_growth_data
  );
  
  RETURN result;
END;
$$;