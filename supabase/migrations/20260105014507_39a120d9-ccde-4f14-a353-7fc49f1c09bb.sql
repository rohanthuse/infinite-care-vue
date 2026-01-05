-- Insert default booking alert settings
-- 10 minute delay before marking as late, 0 minutes after end_time to mark as missed
INSERT INTO booking_alert_settings (
  first_alert_delay_minutes,
  missed_booking_threshold_minutes,
  enable_late_start_alerts,
  enable_missed_booking_alerts
) VALUES (10, 0, true, true)
ON CONFLICT DO NOTHING;