-- Drop overly permissive policies that allow cross-tenant data access
-- These policies have "qual: true" which bypasses organization filtering

DROP POLICY IF EXISTS "Allow authenticated users to manage bank_holidays" ON bank_holidays;
DROP POLICY IF EXISTS "Allow authenticated users to manage expense_types" ON expense_types;
DROP POLICY IF EXISTS "Allow authenticated users to manage file_categories" ON file_categories;
DROP POLICY IF EXISTS "Allow authenticated users to manage report_types" ON report_types;
DROP POLICY IF EXISTS "Allow authenticated users to manage travel_rates" ON travel_rates;