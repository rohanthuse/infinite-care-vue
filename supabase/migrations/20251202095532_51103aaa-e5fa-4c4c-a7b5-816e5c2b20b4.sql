-- Add missing columns to client_events_logs table
ALTER TABLE client_events_logs
ADD COLUMN IF NOT EXISTS family_notification_date date,
ADD COLUMN IF NOT EXISTS family_notification_method text,
ADD COLUMN IF NOT EXISTS gp_notification_date date,
ADD COLUMN IF NOT EXISTS insurance_notification_date date,
ADD COLUMN IF NOT EXISTS external_reporting_details text,
ADD COLUMN IF NOT EXISTS similar_incidents text;

-- Add comments for documentation
COMMENT ON COLUMN client_events_logs.family_notification_date IS 'Date when family was notified about the event';
COMMENT ON COLUMN client_events_logs.family_notification_method IS 'Method used to notify family (phone, email, in-person, etc.)';
COMMENT ON COLUMN client_events_logs.gp_notification_date IS 'Date when GP was notified about the event';
COMMENT ON COLUMN client_events_logs.insurance_notification_date IS 'Date when insurance was notified about the event';
COMMENT ON COLUMN client_events_logs.external_reporting_details IS 'Details about external reporting requirements and submission';
COMMENT ON COLUMN client_events_logs.similar_incidents IS 'Description of similar incidents that have occurred';