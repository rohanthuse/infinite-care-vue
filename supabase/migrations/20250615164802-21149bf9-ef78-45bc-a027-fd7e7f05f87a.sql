
-- Add a unique constraint to the title column of the services table to prevent duplicates
ALTER TABLE public.services ADD CONSTRAINT services_title_key UNIQUE (title);

-- Step 1: Add 'revenue' and 'service_id' columns to the 'bookings' table
ALTER TABLE public.bookings
ADD COLUMN revenue NUMERIC,
ADD COLUMN service_id UUID REFERENCES public.services(id);

-- Step 2: Add more variety to the 'services' table for better chart data
INSERT INTO public.services (title, category, description, double_handed)
VALUES
('Home Care', 'Personal Care', 'Assistance with daily living activities.', false),
('Nurse Visit', 'Medical', 'Skilled nursing visit for medical needs.', false),
('Consultation', 'Medical', 'Medical consultation with a specialist.', false),
('Therapy', 'Rehabilitation', 'Physical or occupational therapy session.', false),
('Respite Care', 'Support', 'Short-term relief for primary caregivers.', true),
('Companionship', 'Social', 'Providing social interaction and company.', false)
ON CONFLICT (title) DO NOTHING;

-- Step 3: Create a helper function to get a random service_id
CREATE OR REPLACE FUNCTION get_random_service_id()
RETURNS UUID AS $$
DECLARE
    random_id UUID;
BEGIN
    SELECT id INTO random_id FROM public.services ORDER BY random() LIMIT 1;
    RETURN random_id;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Update existing bookings with some random data for demonstration
UPDATE public.bookings
SET
  revenue = floor(random() * (200 - 50 + 1) + 50), -- Random revenue between 50 and 200
  service_id = get_random_service_id()
WHERE revenue IS NULL;

-- Step 5: The helper function is no longer needed
DROP FUNCTION get_random_service_id();

-- Step 6: Create a database function to aggregate all chart data in one go
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
            COALESCE(b.bookings_count, 0) AS visits, -- Assuming visits = bookings
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

    -- 2. Client Distribution (New vs Returning)
    SELECT json_agg(dist) INTO client_dist FROM (
        SELECT 'Returning' as name, count(*) as value
        FROM public.clients
        WHERE branch_id = p_branch_id AND (registered_on <= now() - interval '30 days' OR registered_on IS NULL)
        UNION ALL
        SELECT 'New' as name, count(*) as value
        FROM public.clients
        WHERE branch_id = p_branch_id AND registered_on > now() - interval '30 days'
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
    SELECT json_agg(usage) INTO service_usage
    FROM (
        SELECT s.title AS name, count(b.id)::int AS usage
        FROM public.bookings b
        JOIN public.services s ON b.service_id = s.id
        WHERE b.branch_id = p_branch_id AND b.service_id IS NOT NULL
        GROUP BY s.title
        ORDER BY usage DESC
        LIMIT 4
    ) usage;
    
    -- Recalculate usage as percentages
    IF service_usage IS NOT NULL AND json_array_length(service_usage) > 0 THEN
      DECLARE
        total_usage BIGINT;
        temp_service_usage JSONB := '[]'::jsonb;
        service_record JSONB;
      BEGIN
        SELECT sum((elem->>'usage')::bigint) INTO total_usage FROM json_array_elements(service_usage) elem;

        IF total_usage > 0 THEN
          FOR service_record IN SELECT * FROM json_array_elements(service_usage)
          LOOP
            temp_service_usage := temp_service_usage || jsonb_build_object(
              'name', service_record->'name',
              'usage', round(((service_record->>'usage')::numeric / total_usage) * 100)
            );
          END LOOP;
          service_usage := temp_service_usage::json;
        END IF;
      END;
    END IF;


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
