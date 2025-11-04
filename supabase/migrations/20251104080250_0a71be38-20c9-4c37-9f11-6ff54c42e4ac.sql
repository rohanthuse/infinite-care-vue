-- Add billing frequency and invoice tracking to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS billing_frequency text DEFAULT 'monthly' 
  CHECK (billing_frequency IN ('weekly', 'fortnightly', 'monthly', 'on_demand')),
ADD COLUMN IF NOT EXISTS auto_generate_invoices boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS last_invoice_generated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS uninvoiced_bookings_count integer DEFAULT 0;

-- Add invoice tracking to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS included_in_invoice_id uuid REFERENCES client_billing(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_invoiced boolean DEFAULT false;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_is_invoiced ON bookings(is_invoiced) WHERE is_invoiced = false;
CREATE INDEX IF NOT EXISTS idx_bookings_invoice_id ON bookings(included_in_invoice_id);
CREATE INDEX IF NOT EXISTS idx_clients_billing_frequency ON clients(billing_frequency);

-- Create materialized view for clients ready for invoicing
CREATE MATERIALIZED VIEW IF NOT EXISTS clients_ready_for_invoicing AS
SELECT 
  c.id,
  c.first_name,
  c.last_name,
  c.billing_frequency,
  c.last_invoice_generated_at,
  c.branch_id,
  c.organization_id,
  COUNT(b.id) as uninvoiced_count,
  COALESCE(SUM(b.revenue), 0) as unbilled_amount,
  MAX(b.end_time) as last_booking_date
FROM clients c
LEFT JOIN bookings b ON b.client_id = c.id
WHERE (b.status IN ('done', 'completed') OR b.status IS NULL)
  AND (b.is_invoiced = false OR b.is_invoiced IS NULL)
  AND c.auto_generate_invoices = true
GROUP BY c.id, c.first_name, c.last_name, c.billing_frequency, c.last_invoice_generated_at, c.branch_id, c.organization_id;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_ready_for_invoicing_id ON clients_ready_for_invoicing(id);

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_clients_ready_for_invoicing()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY clients_ready_for_invoicing;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh view when bookings change
DROP TRIGGER IF EXISTS trigger_refresh_invoice_queue ON bookings;
CREATE TRIGGER trigger_refresh_invoice_queue
AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_clients_ready_for_invoicing();

-- Create function to update uninvoiced bookings count
CREATE OR REPLACE FUNCTION update_uninvoiced_bookings_count()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update uninvoiced bookings count
DROP TRIGGER IF EXISTS trigger_update_uninvoiced_count ON bookings;
CREATE TRIGGER trigger_update_uninvoiced_count
AFTER INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_uninvoiced_bookings_count();