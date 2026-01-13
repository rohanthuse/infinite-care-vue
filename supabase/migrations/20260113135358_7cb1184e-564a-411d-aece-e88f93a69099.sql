-- Fix bookings incorrectly marked as missed that have completed visit records
-- These bookings have actual start/end times recorded but were marked missed before completion

UPDATE bookings b
SET 
  status = 'done',
  is_missed = false,
  notes = COALESCE(b.notes || E'\n\n', '') || 'Auto-corrected: Visit was completed'
WHERE 
  b.status = 'missed'
  AND EXISTS (
    SELECT 1 FROM visit_records vr 
    WHERE vr.booking_id = b.id 
    AND vr.status = 'completed'
    AND vr.visit_start_time IS NOT NULL
    AND vr.visit_end_time IS NOT NULL
  );