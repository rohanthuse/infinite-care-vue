-- Update get_branch_chart_data to use client status distribution instead of new vs returning

CREATE OR REPLACE FUNCTION get_branch_chart_data(p_branch_id UUID)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    weekly_stats json;
    client_dist json;
    monthly_rev json;
    service_usage json;
    result json;
BEGIN
    -- 1. Weekly Statistics (last 7 days)
    WITH days AS (
        SELECT generate_series(
            date_trunc('day', now() - interval '6 days'),
            date_trunc('day', now()),
            '1 day'::interval
        )::date AS day
    )
    SELECT json_agg(stats) INTO weekly_stats
    FROM (
        SELECT
            to_char(d.day, 'Dy') AS day,
            COALESCE(b.bookings_count, 0) AS bookings,
            COALESCE(b.bookings_count, 0) AS visits,
            COALESCE(b.total_revenue, 0)::real AS revenue
        FROM days d
        LEFT JOIN (
            SELECT
                date_trunc('day', start_time)::date AS booking_day,
                count(*) AS bookings_count,
                sum(revenue) AS total_revenue
            FROM public.bookings
            WHERE branch_id = p_branch_id AND start_time >= date_trunc('day', now() - interval '6 days')
            GROUP BY 1
        ) b ON d.day = b.booking_day
        ORDER BY d.day
    ) stats;

    -- 2. Client Distribution by Status
    SELECT json_agg(dist) INTO client_dist FROM (
        SELECT 
            COALESCE(status, 'Unknown') as name, 
            count(*) as value
        FROM public.clients
        WHERE branch_id = p_branch_id
        GROUP BY status
        ORDER BY 
            CASE status
                WHEN 'Active' THEN 1
                WHEN 'New Enquiries' THEN 2
                WHEN 'Actively Assessing' THEN 3
                WHEN 'Closed Enquiries' THEN 4
                WHEN 'Former' THEN 5
                ELSE 6
            END
    ) dist;

    -- 3. Monthly Revenue (current year)
    WITH months AS (
      SELECT generate_series(
          date_trunc('year', now()),
          date_trunc('year', now()) + interval '11 months',
          '1 month'
      ) as month_date
    ),
    month_names AS (
        SELECT to_char(month_date, 'Mon') as name,
               date_trunc('month', month_date) as month_start
        FROM months
    )
    SELECT json_agg(rev) INTO monthly_rev
    FROM (
        SELECT
            mn.name,
            COALESCE(b.monthly_revenue, 0)::real AS revenue
        FROM month_names mn
        LEFT JOIN (
            SELECT
                date_trunc('month', start_time) as booking_month,
                sum(revenue) AS monthly_revenue
            FROM public.bookings
            WHERE branch_id = p_branch_id AND date_trunc('year', start_time) = date_trunc('year', now())
            GROUP BY 1
        ) b ON mn.month_start = b.booking_month
        ORDER BY mn.month_start
    ) rev;

    -- 4. Popular Services
    WITH service_counts AS (
        SELECT 
            s.title AS name, 
            count(b.id) AS usage
        FROM public.bookings b
        JOIN public.services s ON b.service_id = s.id
        WHERE b.branch_id = p_branch_id AND b.service_id IS NOT NULL
        GROUP BY s.title
    ),
    total_services AS (
        SELECT sum(usage) as total_usage FROM service_counts
    )
    SELECT json_agg(
        json_build_object(
            'name', sc.name,
            'usage', CASE 
                        WHEN ts.total_usage > 0 THEN round((sc.usage::numeric / ts.total_usage) * 100)
                        ELSE 0 
                     END
        )
    ) INTO service_usage
    FROM (
        SELECT name, usage
        FROM service_counts
        ORDER BY usage DESC
        LIMIT 4
    ) sc, total_services ts;

    -- Combine all results into a single JSON object
    SELECT json_build_object(
        'weeklyStats', COALESCE(weekly_stats, '[]'::json),
        'clientDistribution', COALESCE(client_dist, '[]'::json),
        'monthlyRevenue', COALESCE(monthly_rev, '[]'::json),
        'serviceUsage', COALESCE(service_usage, '[]'::json)
    ) INTO result;

    RETURN result;
END;
$$;