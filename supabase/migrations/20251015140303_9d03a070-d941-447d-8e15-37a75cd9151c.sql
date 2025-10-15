-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule edge function to run every 5 minutes
SELECT cron.schedule(
  'send-scheduled-messages',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://vcrjntfjsmpoupgairep.supabase.co/functions/v1/send-scheduled-messages',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjcmpudGZqc21wb3VwZ2FpcmVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NjcxNDAsImV4cCI6MjA2NTU0MzE0MH0.2AACIZItTsFj2-1LGMy0fRcYKvtXd9FtyrRDnkLGsP0"}'::jsonb
  ) as request_id;
  $$
);