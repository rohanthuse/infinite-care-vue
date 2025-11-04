-- Fix calculate_invoice_totals function to use correct column names
-- This fixes the "actual_time_minutes does not exist" error during invoice generation

CREATE OR REPLACE FUNCTION public.calculate_invoice_totals(p_invoice_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
  v_subtotal NUMERIC := 0;
  v_vat_amount NUMERIC := 0;
  v_total NUMERIC := 0;
  v_vat_rate NUMERIC := 0.20;
  v_total_minutes INTEGER := 0;
BEGIN
  -- Calculate subtotal and total minutes from line items
  -- FIXED: Use duration_minutes instead of actual_time_minutes
  SELECT 
    COALESCE(SUM(line_total), 0),
    COALESCE(SUM(duration_minutes), 0)
  INTO v_subtotal, v_total_minutes
  FROM public.invoice_line_items
  WHERE invoice_id = p_invoice_id;
  
  -- Calculate VAT amount (20% of subtotal)
  v_vat_amount := v_subtotal * v_vat_rate;
  
  -- Calculate total
  v_total := v_subtotal + v_vat_amount;
  
  -- Update the invoice with calculated amounts
  UPDATE public.client_billing
  SET 
    net_amount = v_subtotal,
    vat_amount = v_vat_amount,
    total_amount = v_total,
    actual_time_minutes = v_total_minutes,
    updated_at = now()
  WHERE id = p_invoice_id;
END;
$function$;