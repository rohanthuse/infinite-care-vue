-- Add subscription_expires_at and settings to get_optimized_tenant_data function
-- This enables the All Tenant Organisations table to display Subscription End and Duration correctly

-- Drop the existing function first to allow return type changes
DROP FUNCTION IF EXISTS public.get_optimized_tenant_data();

-- Recreate with subscription fields included
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
  subscription_expires_at timestamp with time zone,
  settings jsonb,
  total_users bigint,
  active_users bigint,
  recent_activity_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  WITH organization_stats AS (
    SELECT 
      o.id,
      o.name,
      o.slug,
      o.contact_email,
      o.contact_phone,
      o.subscription_status,
      o.subscription_plan,
      o.created_at,
      o.subscription_expires_at,
      o.settings,
      COALESCE(user_counts.total_users, 0) as total_users,
      COALESCE(user_counts.active_users, 0) as active_users,
      COALESCE(user_counts.recent_activity_count, 0) as recent_activity_count
    FROM public.organizations o
    LEFT JOIN (
      SELECT 
        o2.id as org_id,
        COUNT(DISTINCT suo.system_user_id) as total_users,
        COUNT(DISTINCT CASE 
          WHEN ss.last_activity_at > NOW() - INTERVAL '30 days' 
          THEN suo.system_user_id 
        END) as active_users,
        COUNT(DISTINCT CASE 
          WHEN ss.last_activity_at > NOW() - INTERVAL '7 days' 
          THEN suo.system_user_id 
        END) as recent_activity_count
      FROM public.organizations o2
      LEFT JOIN public.system_user_organizations suo ON o2.id = suo.organization_id
      LEFT JOIN public.system_users su ON suo.system_user_id = su.id
      LEFT JOIN public.system_sessions ss ON su.id = ss.system_user_id
      WHERE su.is_active = true
      GROUP BY o2.id
    ) user_counts ON o.id = user_counts.org_id
  )
  SELECT 
    os.id,
    os.name,
    os.slug,
    os.contact_email,
    os.contact_phone,
    os.subscription_status,
    os.subscription_plan,
    os.created_at,
    os.subscription_expires_at,
    os.settings,
    os.total_users,
    os.active_users,
    os.recent_activity_count
  FROM organization_stats os
  ORDER BY os.created_at DESC;
END;
$$;