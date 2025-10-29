-- Fix GROUP BY issue in get_client_reports_data function
CREATE OR REPLACE FUNCTION public.get_client_reports_data(
  p_branch_id uuid, 
  p_start_date date DEFAULT NULL::date, 
  p_end_date date DEFAULT NULL::date
)
RETURNS json
LANGUAGE plpgsql
AS $function$
DECLARE
  result JSON;
  start_date DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '6 months');
  end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
BEGIN
  WITH client_activity AS (
    SELECT 
      DATE_TRUNC('month', c.registered_on) as month,
      COUNT(*) as new_clients,
      COUNT(CASE WHEN c.status = 'active' THEN 1 END) as active_clients,
      COUNT(CASE WHEN c.status = 'inactive' THEN 1 END) as inactive_clients
    FROM clients c
    WHERE c.branch_id = p_branch_id
      AND c.registered_on BETWEEN start_date AND end_date
    GROUP BY DATE_TRUNC('month', c.registered_on)
    ORDER BY month
  ),
  client_demographics AS (
    SELECT 
      age_group,
      COUNT(*) as count
    FROM (
      SELECT 
        c.id,
        CASE 
          WHEN EXTRACT(YEAR FROM age(c.date_of_birth)) BETWEEN 18 AND 30 THEN '18-30'
          WHEN EXTRACT(YEAR FROM age(c.date_of_birth)) BETWEEN 31 AND 50 THEN '31-50'
          WHEN EXTRACT(YEAR FROM age(c.date_of_birth)) BETWEEN 51 AND 65 THEN '51-65'
          WHEN EXTRACT(YEAR FROM age(c.date_of_birth)) BETWEEN 66 AND 80 THEN '66-80'
          ELSE '81+'
        END as age_group
      FROM clients c
      WHERE c.branch_id = p_branch_id AND c.date_of_birth IS NOT NULL
    ) age_calc
    GROUP BY age_group
  ),
  service_utilization AS (
    SELECT 
      s.title as service_name,
      COUNT(b.id) as booking_count
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.branch_id = p_branch_id
      AND DATE(b.start_time) BETWEEN start_date AND end_date
    GROUP BY s.title
    ORDER BY booking_count DESC
  )
  SELECT json_build_object(
    'clientActivity', COALESCE((SELECT json_agg(
      json_build_object(
        'name', TO_CHAR(month, 'Mon'),
        'active', active_clients,
        'inactive', inactive_clients,
        'new', new_clients
      )
    ) FROM client_activity), '[]'::json),
    'demographics', COALESCE((SELECT json_agg(
      json_build_object(
        'name', age_group,
        'value', count
      )
    ) FROM client_demographics), '[]'::json),
    'serviceUtilization', COALESCE((SELECT json_agg(
      json_build_object(
        'name', service_name,
        'value', booking_count
      )
    ) FROM service_utilization), '[]'::json)
  ) INTO result;
  
  RETURN result;
END;
$function$;