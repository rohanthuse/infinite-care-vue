
-- Create function for service reports data
CREATE OR REPLACE FUNCTION public.get_service_reports_data(p_branch_id uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  result JSON;
  start_date DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '6 months');
  end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
BEGIN
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
    WHERE s.branch_id = p_branch_id OR s.id IN (SELECT DISTINCT service_id FROM bookings WHERE branch_id = p_branch_id)
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
$function$;

-- Create function for compliance reports data
CREATE OR REPLACE FUNCTION public.get_compliance_reports_data(p_branch_id uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  result JSON;
  start_date DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '6 months');
  end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
BEGIN
  WITH training_compliance AS (
    SELECT 
      'DBS Checks' as training_type,
      COUNT(CASE WHEN s.dbs_status = 'valid' THEN 1 END) as compliant,
      COUNT(CASE WHEN s.dbs_status != 'valid' OR s.dbs_status IS NULL THEN 1 END) as noncompliant
    FROM staff s
    WHERE s.branch_id = p_branch_id AND s.status = 'active'
    UNION ALL
    SELECT 
      'First Aid' as training_type,
      COUNT(CASE WHEN s.qualifications IS NOT NULL AND 'First Aid' = ANY(s.qualifications) THEN 1 END) as compliant,
      COUNT(CASE WHEN s.qualifications IS NULL OR NOT 'First Aid' = ANY(s.qualifications) THEN 1 END) as noncompliant
    FROM staff s
    WHERE s.branch_id = p_branch_id AND s.status = 'active'
    UNION ALL
    SELECT 
      'Safeguarding' as training_type,
      COUNT(CASE WHEN s.qualifications IS NOT NULL AND 'Safeguarding' = ANY(s.qualifications) THEN 1 END) as compliant,
      COUNT(CASE WHEN s.qualifications IS NULL OR NOT 'Safeguarding' = ANY(s.qualifications) THEN 1 END) as noncompliant
    FROM staff s
    WHERE s.branch_id = p_branch_id AND s.status = 'active'
  ),
  incident_types AS (
    SELECT 
      cel.category as incident_type,
      COUNT(*) as count
    FROM client_events_logs cel
    WHERE cel.branch_id = p_branch_id
      AND DATE(cel.created_at) BETWEEN start_date AND end_date
      AND cel.category IS NOT NULL
    GROUP BY cel.category
    ORDER BY count DESC
    LIMIT 5
  ),
  compliance_trends AS (
    SELECT 
      TO_CHAR(DATE_TRUNC('month', cel.created_at), 'Mon') as month,
      COUNT(*) as incidents
    FROM client_events_logs cel
    WHERE cel.branch_id = p_branch_id
      AND DATE(cel.created_at) BETWEEN start_date AND end_date
    GROUP BY DATE_TRUNC('month', cel.created_at)
    ORDER BY DATE_TRUNC('month', cel.created_at)
  )
  SELECT json_build_object(
    'trainingCompliance', COALESCE((SELECT json_agg(
      json_build_object(
        'name', training_type,
        'compliant', compliant,
        'noncompliant', noncompliant
      )
    ) FROM training_compliance), '[]'::json),
    'incidentTypes', COALESCE((SELECT json_agg(
      json_build_object(
        'name', incident_type,
        'value', count
      )
    ) FROM incident_types), '[]'::json),
    'complianceTrends', COALESCE((SELECT json_agg(
      json_build_object(
        'month', month,
        'incidents', incidents
      )
    ) FROM compliance_trends), '[]'::json)
  ) INTO result;
  
  RETURN result;
END;
$function$;
