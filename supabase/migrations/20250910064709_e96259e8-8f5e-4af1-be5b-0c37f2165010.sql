-- Fix the get_financial_reports_data function to properly handle organization_id filtering
CREATE OR REPLACE FUNCTION public.get_financial_reports_data(p_branch_id uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date)
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

  WITH service_revenue AS (
    SELECT 
      TO_CHAR(DATE_TRUNC('month', b.start_time), 'Mon') as month,
      s.title as service_name,
      SUM(b.revenue) as revenue
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.branch_id = p_branch_id
      AND s.organization_id = branch_org_id
      AND DATE(b.start_time) BETWEEN start_date AND end_date
      AND b.status = 'completed'
    GROUP BY DATE_TRUNC('month', b.start_time), s.title
    ORDER BY DATE_TRUNC('month', b.start_time)
  ),
  monthly_revenue AS (
    SELECT 
      TO_CHAR(DATE_TRUNC('month', b.start_time), 'Mon') as month,
      SUM(b.revenue) as revenue
    FROM bookings b
    WHERE b.branch_id = p_branch_id
      AND DATE(b.start_time) BETWEEN start_date AND end_date
      AND b.status = 'completed'
    GROUP BY DATE_TRUNC('month', b.start_time)
    ORDER BY DATE_TRUNC('month', b.start_time)
  ),
  monthly_expenses AS (
    SELECT 
      TO_CHAR(DATE_TRUNC('month', e.expense_date), 'Mon') as month,
      SUM(e.amount) as expenses
    FROM expenses e
    WHERE e.branch_id = p_branch_id
      AND DATE(e.expense_date) BETWEEN start_date AND end_date
      AND e.status = 'approved'
    GROUP BY DATE_TRUNC('month', e.expense_date)
    ORDER BY DATE_TRUNC('month', e.expense_date)
  ),
  monthly_profit AS (
    SELECT 
      COALESCE(r.month, e.month) as month,
      COALESCE(r.revenue, 0) as revenue,
      COALESCE(e.expenses, 0) as expenses,
      COALESCE(r.revenue, 0) - COALESCE(e.expenses, 0) as profit
    FROM monthly_revenue r
    FULL OUTER JOIN monthly_expenses e USING (month)
    ORDER BY month
  )
  SELECT json_build_object(
    'monthlyRevenue', COALESCE((SELECT json_agg(
      json_build_object(
        'month', month,
        'revenue', COALESCE(revenue, 0),
        'expenses', COALESCE(expenses, 0),
        'profit', COALESCE(profit, 0)
      )
    ) FROM monthly_profit), '[]'::json),
    'serviceRevenue', COALESCE((SELECT json_agg(
      json_build_object(
        'name', service_name,
        'value', COALESCE(revenue, 0)
      )
    ) FROM service_revenue), '[]'::json)
  ) INTO result;
  
  RETURN result;
END;
$function$