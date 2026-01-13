-- Backfill: Mark all past bookings without completed visits as 'missed'
-- This fixes bookings that were stuck in assigned/unassigned/confirmed status

UPDATE bookings b
SET 
  status = 'missed',
  is_missed = true,
  missed_notified_at = NOW(),
  notes = COALESCE(notes || E'\n\n', '') || 'Auto-backfill: Visit not started'
WHERE 
  end_time < NOW()
  AND status IN ('assigned', 'unassigned', 'confirmed')
  AND cancelled_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM visit_records vr 
    WHERE vr.booking_id = b.id 
    AND vr.status = 'completed'
  );