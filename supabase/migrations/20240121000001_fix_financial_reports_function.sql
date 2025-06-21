
-- Fix the get_financial_reports_data function to resolve GROUP BY error
CREATE OR REPLACE FUNCTION public.get_financial_reports_data(p_branch_id uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  result JSON;
  start_date DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '6 months');
  end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
BEGIN
  WITH monthly_revenue AS (
    SELECT 
      TO_CHAR(month_series, 'Mon') as month,
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
    WHERE s.branch_id = p_branch_id
    GROUP BY s.title, s.id
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
$function$
