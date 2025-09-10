-- Fix the get_service_reports_data function to properly handle organization_id filtering
CREATE OR REPLACE FUNCTION public.get_service_reports_data(p_branch_id uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  result JSON;
  start_date DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '6 months');
  end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
  branch_org_id UUID;
BEGIN
  -- Get the organization_id for the given branch
  SELECT organization_id INTO branch_org_id
  FROM branches
  WHERE id = p_branch_id;

  WITH service_utilization AS (
    SELECT 
      s.title as service_name,
      COUNT(b.id) as booking_count,
      AVG(EXTRACT(EPOCH FROM (b.end_time - b.start_time))/3600) as avg_duration_hours,
      SUM(b.revenue) as total_revenue
    FROM services s
    LEFT JOIN bookings b ON s.id = b.service_id 
      AND b.branch_id = p_branch_id 
      AND DATE(b.start_time) BETWEEN start_date AND end_date
    WHERE s.organization_id = branch_org_id
    GROUP BY s.id, s.title
    ORDER BY booking_count DESC
  ),
  service_trends AS (
    SELECT 
      TO_CHAR(DATE_TRUNC('month', b.start_time), 'Mon YYYY') as month,
      s.title as service_name,
      COUNT(b.id) as count
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.branch_id = p_branch_id
      AND s.organization_id = branch_org_id
      AND DATE(b.start_time) BETWEEN start_date AND end_date
    GROUP BY DATE_TRUNC('month', b.start_time), s.title
    ORDER BY DATE_TRUNC('month', b.start_time)
  ),
  client_satisfaction AS (
    SELECT 
      'Overall' as category,
      85 as satisfaction_score, -- Placeholder - would need actual review data
      'Good' as rating
    UNION ALL
    SELECT 
      'Service Quality' as category,
      88 as satisfaction_score,
      'Good' as rating
    UNION ALL
    SELECT 
      'Timeliness' as category,
      82 as satisfaction_score,
      'Good' as rating
  )
  SELECT json_build_object(
    'serviceUtilization', COALESCE((SELECT json_agg(
      json_build_object(
        'name', service_name,
        'bookings', booking_count,
        'avgDuration', ROUND(avg_duration_hours, 2),
        'revenue', COALESCE(total_revenue, 0)
      )
    ) FROM service_utilization), '[]'::json),
    'serviceTrends', COALESCE((SELECT json_agg(
      json_build_object(
        'month', month,
        'service', service_name,
        'count', count
      )
    ) FROM service_trends), '[]'::json),
    'clientSatisfaction', COALESCE((SELECT json_agg(
      json_build_object(
        'name', category,
        'score', satisfaction_score,
        'rating', rating
      )
    ) FROM client_satisfaction), '[]'::json)
  ) INTO result;
  
  RETURN result;
END;
$function$