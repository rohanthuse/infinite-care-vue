-- Fix security warnings by setting search_path on functions

-- Update map_booking_status_to_invoice_status with search_path
CREATE OR REPLACE FUNCTION map_booking_status_to_invoice_status(booking_status TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE booking_status
    WHEN 'done' THEN 'pending'
    WHEN 'cancelled' THEN 'cancelled'
    WHEN 'departed' THEN 'cancelled'
    WHEN 'assigned' THEN 'draft'
    WHEN 'unassigned' THEN 'draft'
    WHEN 'in-progress' THEN 'draft'
    WHEN 'suspended' THEN 'draft'
    ELSE 'draft'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = '';

-- Update generate_invoice_number with search_path
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  invoice_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO next_number
  FROM client_billing
  WHERE invoice_number ~ '^INV-[0-9]+$';
  
  invoice_number := 'INV-' || LPAD(next_number::TEXT, 6, '0');
  RETURN invoice_number;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Update auto_create_invoice_for_booking with search_path
CREATE OR REPLACE FUNCTION auto_create_invoice_for_booking()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_number TEXT;
  v_description TEXT;
  v_invoice_date DATE;
  v_due_date DATE;
  v_invoice_status TEXT;
  v_organization_id UUID;
  v_service_name TEXT;
BEGIN
  IF NEW.revenue > 0 AND NOT EXISTS (
    SELECT 1 FROM client_billing WHERE booking_id = NEW.id
  ) THEN
    
    SELECT organization_id INTO v_organization_id
    FROM branches
    WHERE id = NEW.branch_id;
    
    SELECT title INTO v_service_name
    FROM services
    WHERE id = NEW.service_id;
    
    v_invoice_number := generate_invoice_number();
    v_invoice_date := NEW.start_time::DATE;
    v_due_date := v_invoice_date + INTERVAL '30 days';
    v_invoice_status := map_booking_status_to_invoice_status(NEW.status);
    
    v_description := 'Auto-generated invoice for booking on ' || 
                     TO_CHAR(NEW.start_time, 'DD Mon YYYY') ||
                     COALESCE(' - ' || v_service_name, '');
    
    INSERT INTO client_billing (
      invoice_number,
      client_id,
      organization_id,
      branch_id,
      booking_id,
      amount,
      description,
      invoice_date,
      due_date,
      status,
      invoice_type,
      generated_from_booking,
      created_at,
      updated_at
    ) VALUES (
      v_invoice_number,
      NEW.client_id,
      v_organization_id,
      NEW.branch_id,
      NEW.id,
      NEW.revenue,
      v_description,
      v_invoice_date,
      v_due_date,
      v_invoice_status,
      'automatic',
      TRUE,
      NOW(),
      NOW()
    );
    
    UPDATE bookings 
    SET is_invoiced = TRUE
    WHERE id = NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Update sync_invoice_status_with_booking with search_path
CREATE OR REPLACE FUNCTION sync_invoice_status_with_booking()
RETURNS TRIGGER AS $$
DECLARE
  v_new_invoice_status TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    
    v_new_invoice_status := map_booking_status_to_invoice_status(NEW.status);
    
    UPDATE client_billing
    SET 
      status = v_new_invoice_status,
      updated_at = NOW()
    WHERE 
      booking_id = NEW.id
      AND status NOT IN ('paid', 'refunded')
      AND generated_from_booking = TRUE;
      
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;