-- Function to sync booking status from visit_records
-- This repairs existing inconsistent data where visit is completed but booking status is stuck
CREATE OR REPLACE FUNCTION sync_booking_status_from_visit()
RETURNS TABLE(synced_count INTEGER) AS $$
DECLARE
  sync_count INTEGER;
BEGIN
  -- Update bookings to 'done' where visit is completed but booking is in_progress
  WITH updated AS (
    UPDATE bookings b
    SET status = 'done'
    FROM visit_records vr
    WHERE vr.booking_id = b.id
      AND vr.status = 'completed'
      AND vr.visit_end_time IS NOT NULL
      AND b.status = 'in_progress'
    RETURNING b.id
  )
  SELECT COUNT(*)::INTEGER INTO sync_count FROM updated;
  
  RAISE NOTICE 'Synced % booking statuses from in_progress to done', sync_count;
  
  RETURN QUERY SELECT sync_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the sync immediately to fix existing data
SELECT sync_booking_status_from_visit();

-- Trigger function to automatically sync booking status when visit_record is completed
CREATE OR REPLACE FUNCTION auto_sync_booking_on_visit_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- When visit record is marked as completed, update booking to done
  IF NEW.status = 'completed' AND NEW.visit_end_time IS NOT NULL 
     AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    UPDATE bookings
    SET status = 'done'
    WHERE id = NEW.booking_id
      AND status IN ('in_progress', 'assigned', 'scheduled');
      
    RAISE NOTICE 'Auto-synced booking % to done status', NEW.booking_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_sync_booking_on_visit_complete ON visit_records;

-- Create trigger to auto-sync booking status
CREATE TRIGGER trigger_sync_booking_on_visit_complete
  AFTER UPDATE ON visit_records
  FOR EACH ROW
  EXECUTE FUNCTION auto_sync_booking_on_visit_complete();

COMMENT ON FUNCTION sync_booking_status_from_visit() IS 'Repairs inconsistent booking statuses by syncing from visit_records';
COMMENT ON FUNCTION auto_sync_booking_on_visit_complete() IS 'Automatically updates booking status to done when visit is completed';
COMMENT ON TRIGGER trigger_sync_booking_on_visit_complete ON visit_records IS 'Ensures booking status stays in sync with visit completion';