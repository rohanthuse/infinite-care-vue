-- Enhance invoice_line_items table for detailed ledger system
ALTER TABLE public.invoice_line_items 
ADD COLUMN IF NOT EXISTS visit_date date,
ADD COLUMN IF NOT EXISTS day_type text DEFAULT 'weekday',
ADD COLUMN IF NOT EXISTS service_start_time time,
ADD COLUMN IF NOT EXISTS service_end_time time,
ADD COLUMN IF NOT EXISTS rate_type_applied text DEFAULT 'hourly',
ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS rate_per_unit numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS bank_holiday_multiplier_applied numeric(3,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS visit_record_id uuid,
ADD COLUMN IF NOT EXISTS booking_id uuid;

-- Enhance client_billing table for invoice periods and totals
ALTER TABLE public.client_billing 
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS end_date date,
ADD COLUMN IF NOT EXISTS total_invoiced_hours_minutes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_amount numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS vat_amount numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_ledger_locked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS locked_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS locked_by uuid,
ADD COLUMN IF NOT EXISTS authority_type text;

-- Create function to determine day type based on date
CREATE OR REPLACE FUNCTION public.get_day_type(check_date date, branch_id_param uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  day_of_week integer;
  is_bank_holiday boolean := false;
BEGIN
  -- Get day of week (0 = Sunday, 6 = Saturday)
  day_of_week := EXTRACT(DOW FROM check_date);
  
  -- Check if it's a bank holiday
  SELECT EXISTS (
    SELECT 1 FROM public.bank_holidays bh
    WHERE bh.registered_on = check_date
    AND (bh.organization_id IS NULL OR bh.organization_id = (
      SELECT b.organization_id FROM public.branches b WHERE b.id = branch_id_param
    ))
  ) INTO is_bank_holiday;
  
  IF is_bank_holiday THEN
    RETURN 'bank_holiday';
  ELSIF day_of_week IN (0, 6) THEN
    RETURN 'weekend';
  ELSE
    RETURN 'weekday';
  END IF;
END;
$$;

-- Create function to get applicable rate for client and service
CREATE OR REPLACE FUNCTION public.get_client_rate(
  client_id_param uuid,
  service_date date,
  day_type_param text,
  duration_minutes_param integer
)
RETURNS TABLE(
  rate_amount numeric,
  rate_type text,
  is_vatable boolean,
  bank_holiday_multiplier numeric
)
LANGUAGE plpgsql
AS $$
DECLARE
  base_rate numeric := 0;
  rate_type_result text := 'hourly';
  vat_flag boolean := false;
  multiplier numeric := 1.0;
BEGIN
  -- Get the most recent active rate for the client
  SELECT 
    COALESCE(crs.hourly_rate, sr.amount) as rate,
    COALESCE(crs.rate_type, sr.rate_type) as rate_type_val,
    COALESCE(sr.is_vatable, false) as vat_flag_val
  INTO base_rate, rate_type_result, vat_flag
  FROM public.clients c
  LEFT JOIN public.client_rate_schedules crs ON crs.client_id = c.id 
    AND crs.effective_from <= service_date 
    AND (crs.effective_until IS NULL OR crs.effective_until >= service_date)
  LEFT JOIN public.service_rates sr ON sr.id = crs.service_rate_id
  WHERE c.id = client_id_param
  ORDER BY crs.effective_from DESC NULLS LAST
  LIMIT 1;
  
  -- Apply bank holiday multiplier
  IF day_type_param = 'bank_holiday' THEN
    multiplier := 2.0; -- 2x rate for bank holidays
  ELSIF day_type_param = 'weekend' THEN
    multiplier := 1.5; -- 1.5x rate for weekends
  END IF;
  
  -- Convert to hourly if duration > 60 minutes and rate type is per_minute
  IF duration_minutes_param > 60 AND rate_type_result = 'per_minute' THEN
    rate_type_result := 'hourly';
  END IF;
  
  RETURN QUERY SELECT 
    COALESCE(base_rate, 20.00) * multiplier as rate_amount,
    rate_type_result,
    vat_flag,
    multiplier;
END;
$$;

-- Create function to generate invoice ledger from visit records
CREATE OR REPLACE FUNCTION public.generate_invoice_ledger(
  invoice_id_param uuid,
  client_id_param uuid,
  start_date_param date,
  end_date_param date
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  visit_record RECORD;
  rate_info RECORD;
  line_total numeric;
  day_type_val text;
  duration_mins integer;
  client_branch_id uuid;
BEGIN
  -- Get client's branch ID
  SELECT branch_id INTO client_branch_id 
  FROM public.clients WHERE id = client_id_param;
  
  -- Clear existing line items for this invoice
  DELETE FROM public.invoice_line_items WHERE invoice_id = invoice_id_param;
  
  -- Generate line items from visit records or bookings
  FOR visit_record IN
    SELECT DISTINCT
      COALESCE(vr.id, b.id) as record_id,
      COALESCE(vr.visit_date, b.start_time::date) as visit_date,
      COALESCE(vr.start_time, b.start_time::time) as start_time,
      COALESCE(vr.end_time, b.end_time::time) as end_time,
      COALESCE(vr.actual_duration_minutes, 
               EXTRACT(EPOCH FROM (b.end_time - b.start_time))/60) as duration_minutes,
      b.id as booking_id,
      vr.id as visit_record_id,
      COALESCE(vr.service_provided, 'Care Service') as service_description
    FROM public.bookings b
    LEFT JOIN public.visit_records vr ON vr.booking_id = b.id
    WHERE b.client_id = client_id_param
    AND COALESCE(vr.visit_date, b.start_time::date) BETWEEN start_date_param AND end_date_param
    AND b.status NOT IN ('cancelled', 'no_show')
    ORDER BY COALESCE(vr.visit_date, b.start_time::date), start_time
  LOOP
    -- Get day type
    day_type_val := public.get_day_type(visit_record.visit_date, client_branch_id);
    
    -- Get rate information
    SELECT * INTO rate_info 
    FROM public.get_client_rate(
      client_id_param, 
      visit_record.visit_date, 
      day_type_val, 
      visit_record.duration_minutes::integer
    );
    
    -- Calculate line total based on rate type
    CASE rate_info.rate_type
      WHEN 'hourly' THEN
        line_total := (visit_record.duration_minutes / 60.0) * rate_info.rate_amount;
      WHEN 'per_minute' THEN
        line_total := visit_record.duration_minutes * rate_info.rate_amount;
      WHEN 'daily' THEN
        line_total := rate_info.rate_amount;
      WHEN 'per_visit' THEN
        line_total := rate_info.rate_amount;
      ELSE
        line_total := (visit_record.duration_minutes / 60.0) * rate_info.rate_amount;
    END CASE;
    
    -- Insert line item
    INSERT INTO public.invoice_line_items (
      invoice_id,
      description,
      quantity,
      unit_price,
      line_total,
      visit_date,
      day_type,
      service_start_time,
      service_end_time,
      rate_type_applied,
      duration_minutes,
      rate_per_unit,
      bank_holiday_multiplier_applied,
      visit_record_id,
      booking_id
    ) VALUES (
      invoice_id_param,
      visit_record.service_description || ' - ' || 
      TO_CHAR(visit_record.visit_date, 'Day DD/MM/YYYY') || 
      ' (' || INITCAP(day_type_val) || ') ' ||
      TO_CHAR(visit_record.start_time, 'HH24:MI') || '–' ||
      TO_CHAR(visit_record.end_time, 'HH24:MI'),
      CASE 
        WHEN rate_info.rate_type = 'hourly' THEN (visit_record.duration_minutes / 60.0)
        WHEN rate_info.rate_type = 'per_minute' THEN visit_record.duration_minutes
        ELSE 1
      END,
      rate_info.rate_amount,
      line_total,
      visit_record.visit_date,
      day_type_val,
      visit_record.start_time,
      visit_record.end_time,
      rate_info.rate_type,
      visit_record.duration_minutes::integer,
      rate_info.rate_amount,
      rate_info.bank_holiday_multiplier,
      visit_record.visit_record_id,
      visit_record.booking_id
    );
  END LOOP;
  
  -- Update invoice totals
  PERFORM public.calculate_invoice_totals(invoice_id_param);
END;
$$;

-- Create function to calculate invoice totals including VAT
CREATE OR REPLACE FUNCTION public.calculate_invoice_totals(invoice_id_param uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  net_total numeric := 0;
  vat_total numeric := 0;
  total_hours integer := 0;
  invoice_record RECORD;
BEGIN
  -- Calculate totals from line items
  SELECT 
    COALESCE(SUM(line_total), 0) as net,
    COALESCE(SUM(duration_minutes), 0) as total_mins
  INTO net_total, total_hours
  FROM public.invoice_line_items 
  WHERE invoice_id = invoice_id_param;
  
  -- Calculate VAT (assuming 20% VAT rate for applicable services)
  -- VAT calculation would be based on rate configuration
  SELECT 
    COALESCE(SUM(
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM public.client_rate_schedules crs
          JOIN public.service_rates sr ON sr.id = crs.service_rate_id
          WHERE crs.client_id = cb.client_id AND sr.is_vatable = true
        ) THEN line_total * 0.20
        ELSE 0
      END
    ), 0) INTO vat_total
  FROM public.invoice_line_items ili
  JOIN public.client_billing cb ON cb.id = ili.invoice_id
  WHERE ili.invoice_id = invoice_id_param;
  
  -- Update invoice with calculated totals
  UPDATE public.client_billing 
  SET 
    net_amount = net_total,
    vat_amount = vat_total,
    amount = net_total, -- Keep for compatibility
    total_amount = net_total + vat_total,
    total_invoiced_hours_minutes = total_hours,
    updated_at = now()
  WHERE id = invoice_id_param;
END;
$$;

-- Create trigger to auto-calculate invoice totals when line items change
CREATE OR REPLACE FUNCTION public.trigger_calculate_invoice_totals()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Recalculate totals for the affected invoice
  PERFORM public.calculate_invoice_totals(COALESCE(NEW.invoice_id, OLD.invoice_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for automatic total calculation
DROP TRIGGER IF EXISTS invoice_line_items_totals_trigger ON public.invoice_line_items;
CREATE TRIGGER invoice_line_items_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.invoice_line_items
  FOR EACH ROW EXECUTE FUNCTION public.trigger_calculate_invoice_totals();