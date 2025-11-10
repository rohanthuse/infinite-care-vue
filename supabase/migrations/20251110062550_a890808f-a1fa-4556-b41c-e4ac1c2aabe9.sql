-- Create function to sync invoice status with booking status
CREATE OR REPLACE FUNCTION sync_invoice_status_with_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if booking status has changed
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    
    -- Update related invoice status based on booking status
    UPDATE client_billing
    SET 
      status = CASE
        WHEN NEW.status = 'assigned' THEN 'draft'
        WHEN NEW.status = 'unassigned' THEN 'draft'
        WHEN NEW.status = 'in_progress' THEN 'pending'
        WHEN NEW.status = 'done' THEN 'ready_to_send'
        WHEN NEW.status = 'cancelled' THEN 'cancelled'
        WHEN NEW.status = 'suspended' THEN 'on_hold'
        ELSE status -- Keep existing status for other cases
      END,
      updated_at = NOW()
    WHERE booking_id = NEW.id
      AND booking_id IS NOT NULL;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_sync_invoice_status ON bookings;
CREATE TRIGGER trigger_sync_invoice_status
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION sync_invoice_status_with_booking();