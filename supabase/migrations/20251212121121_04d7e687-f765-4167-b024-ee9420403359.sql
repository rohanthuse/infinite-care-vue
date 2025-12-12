-- Mark all past bookings that weren't started as missed
UPDATE bookings
SET 
  is_missed = true,
  missed_notified_at = NOW(),
  is_late_start = true,
  late_start_notified_at = NOW(),
  late_start_minutes = EXTRACT(EPOCH FROM (NOW() - start_time)) / 60
WHERE 
  start_time < NOW()
  AND status IN ('confirmed', 'assigned')
  AND (is_missed = false OR is_missed IS NULL)
  AND cancelled_at IS NULL;