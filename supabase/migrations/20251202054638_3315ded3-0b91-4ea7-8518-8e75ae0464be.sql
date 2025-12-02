-- =====================================================
-- CRON Job: Daily Subscription Expiry Processing
-- =====================================================
-- Runs daily at midnight to check and deactivate expired subscriptions

-- Enable pg_cron and pg_net extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule the subscription expiry processing to run daily at midnight
SELECT cron.schedule(
  'process-subscription-expiry-daily',
  '0 0 * * *', -- Daily at midnight (00:00)
  $$
  SELECT net.http_post(
    url := 'https://vcrjntfjsmpoupgairep.supabase.co/functions/v1/process-subscription-expiry',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjcmpudGZqc21wb3VwZ2FpcmVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NjcxNDAsImV4cCI6MjA2NTU0MzE0MH0.2AACIZItTsFj2-1LGMy0fRcYKvtXd9FtyrRDnkLGsP0"}'::jsonb,
    body := '{"trigger": "cron"}'::jsonb
  ) AS request_id;
  $$
);