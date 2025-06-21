
-- Create database functions for comprehensive reporting

-- Function to get client reports data
CREATE OR REPLACE FUNCTION get_client_reports_data(
  p_branch_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
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
      CASE 
        WHEN EXTRACT(YEAR FROM age(date_of_birth)) BETWEEN 18 AND 30 THEN '18-30'
        WHEN EXTRACT(YEAR FROM age(date_of_birth)) BETWEEN 31 AND 50 THEN '31-50'
        WHEN EXTRACT(YEAR FROM age(date_of_birth)) BETWEEN 51 AND 65 THEN '51-65'
        WHEN EXTRACT(YEAR FROM age(date_of_birth)) BETWEEN 66 AND 80 THEN '66-80'
        ELSE '81+'
      END as age_group,
      COUNT(*) as count
    FROM clients c
    WHERE c.branch_id = p_branch_id AND c.date_of_birth IS NOT NULL
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
$$;

-- Function to get staff reports data
CREATE OR REPLACE FUNCTION get_staff_reports_data(
  p_branch_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
  start_date DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '1 month');
  end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
BEGIN
  WITH staff_performance AS (
    SELECT 
      CONCAT(s.first_name, ' ', s.last_name) as name,
      COUNT(b.id) as completed_tasks,
      COUNT(CASE WHEN b.status = 'completed' THEN 1 END) * 100.0 / NULLIF(COUNT(b.id), 0) as completion_rate,
      95 as on_time_percentage -- Placeholder, would need actual time tracking
    FROM staff s
    LEFT JOIN bookings b ON s.id = b.staff_id AND DATE(b.start_time) BETWEEN start_date AND end_date
    WHERE s.branch_id = p_branch_id
    GROUP BY s.id, s.first_name, s.last_name
    ORDER BY completed_tasks DESC
    LIMIT 10
  ),
  staff_availability AS (
    SELECT 
      TO_CHAR(generate_series::date, 'Dy') as day,
      COUNT(DISTINCT s.id) as available,
      0 as unavailable -- Placeholder, would need availability tracking
    FROM generate_series(start_date, end_date, '1 day'::interval) 
    CROSS JOIN staff s
    WHERE s.branch_id = p_branch_id AND s.status = 'active'
    GROUP BY generate_series::date
    ORDER BY generate_series::date
  )
  SELECT json_build_object(
    'performance', COALESCE((SELECT json_agg(
      json_build_object(
        'name', name,
        'completedTasks', completed_tasks,
        'onTimePercentage', ROUND(on_time_percentage, 0)
      )
    ) FROM staff_performance), '[]'::json),
    'availability', COALESCE((SELECT json_agg(
      json_build_object(
        'day', day,
        'available', available,
        'unavailable', unavailable
      )
    ) FROM staff_availability WHERE day IN ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')), '[]'::json)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Function to get financial reports data
CREATE OR REPLACE FUNCTION get_financial_reports_data(
  p_branch_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
  start_date DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '6 months');
  end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
BEGIN
  WITH monthly_revenue AS (
    SELECT 
      TO_CHAR(DATE_TRUNC('month', b.start_time), 'Mon') as month,
      COALESCE(SUM(b.revenue), 0) as revenue,
      COALESCE(SUM(e.amount), 0) as expenses,
      COALESCE(SUM(b.revenue), 0) - COALESCE(SUM(e.amount), 0) as profit
    FROM generate_series(start_date, end_date, '1 month'::interval) as month_series
    LEFT JOIN bookings b ON DATE_TRUNC('month', b.start_time) = month_series AND b.branch_id = p_branch_id
    LEFT JOIN expenses e ON DATE_TRUNC('month', e.expense_date) = month_series AND e.branch_id = p_branch_id
    GROUP BY month_series
    ORDER BY month_series
  ),
  service_revenue AS (
    SELECT 
      s.title as name,
      COALESCE(SUM(b.revenue), 0) as value
    FROM services s
    LEFT JOIN bookings b ON s.id = b.service_id AND b.branch_id = p_branch_id 
      AND DATE(b.start_time) BETWEEN start_date AND end_date
    GROUP BY s.title
    HAVING SUM(b.revenue) > 0
    ORDER BY value DESC
    LIMIT 5
  )
  SELECT json_build_object(
    'monthlyRevenue', COALESCE((SELECT json_agg(
      json_build_object(
        'month', month,
        'revenue', revenue,
        'expenses', expenses,
        'profit', profit
      )
    ) FROM monthly_revenue), '[]'::json),
    'serviceRevenue', COALESCE((SELECT json_agg(
      json_build_object(
        'name', name,
        'value', value
      )
    ) FROM service_revenue), '[]'::json)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Function to get operational reports data
CREATE OR REPLACE FUNCTION get_operational_reports_data(
  p_branch_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
  start_date DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '1 week');
  end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
BEGIN
  WITH task_completion AS (
    SELECT 
      TO_CHAR(DATE_TRUNC('day', b.start_time), 'Dy') as day,
      COUNT(*) as scheduled,
      COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed,
      COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled
    FROM bookings b
    WHERE b.branch_id = p_branch_id
      AND DATE(b.start_time) BETWEEN start_date AND end_date
    GROUP BY DATE_TRUNC('day', b.start_time)
    ORDER BY DATE_TRUNC('day', b.start_time)
  )
  SELECT json_build_object(
    'taskCompletion', COALESCE((SELECT json_agg(
      json_build_object(
        'day', day,
        'scheduled', scheduled,
        'completed', completed,
        'cancelled', cancelled
      )
    ) FROM task_completion), '[]'::json)
  ) INTO result;
  
  RETURN result;
END;
$$;
