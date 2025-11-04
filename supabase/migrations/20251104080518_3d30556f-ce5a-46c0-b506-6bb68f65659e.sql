-- Fix search_path security issues by recreating functions properly
DROP TRIGGER IF EXISTS trigger_refresh_invoice_queue ON bookings;
DROP TRIGGER IF EXISTS trigger_update_uninvoiced_count ON bookings;

-- Recreate refresh function with proper security
DROP FUNCTION IF EXISTS refresh_clients_ready_for_invoicing() CASCADE;
CREATE OR REPLACE FUNCTION refresh_clients_ready_for_invoicing()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY clients_ready_for_invoicing;
  RETURN NULL;
END;
$$;

-- Recreate uninvoiced count function with proper security
DROP FUNCTION IF EXISTS update_uninvoiced_bookings_count() CASCADE;
CREATE OR REPLACE FUNCTION update_uninvoiced_bookings_count()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status IN ('done', 'completed') AND NEW.is_invoiced = false THEN
    UPDATE clients 
    SET uninvoiced_bookings_count = (
      SELECT COUNT(*) FROM bookings 
      WHERE client_id = NEW.client_id 
      AND status IN ('done', 'completed') 
      AND is_invoiced = false
    )
    WHERE id = NEW.client_id;
  END IF;
  
  IF TG_OP = 'UPDATE' AND OLD.is_invoiced = false AND NEW.is_invoiced = true THEN
    UPDATE clients 
    SET uninvoiced_bookings_count = GREATEST(0, uninvoiced_bookings_count - 1),
        last_invoice_generated_at = NOW()
    WHERE id = NEW.client_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER trigger_refresh_invoice_queue
AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_clients_ready_for_invoicing();

CREATE TRIGGER trigger_update_uninvoiced_count
AFTER INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_uninvoiced_bookings_count();

-- Secure the materialized view
REVOKE ALL ON clients_ready_for_invoicing FROM anon;
GRANT SELECT ON clients_ready_for_invoicing TO authenticated;