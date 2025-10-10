-- Fix invoice deletion error: "column crs.service_rate_id does not exist"
-- This migration fixes two issues:
-- 1. Updates trigger to skip recalculation during DELETE operations
-- 2. Fixes calculate_invoice_totals function by removing broken JOIN with service_rates

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.calculate_invoice_totals(uuid);

-- Update the trigger function to skip DELETE operations
CREATE OR REPLACE FUNCTION public.trigger_calculate_invoice_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Skip recalculation during DELETE operations (no need to recalculate when deleting)
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  
  -- For INSERT and UPDATE, recalculate the invoice totals
  PERFORM calculate_invoice_totals(NEW.invoice_id);
  RETURN NEW;
END;
$$;

-- Recreate the calculate_invoice_totals function with fixed logic
CREATE OR REPLACE FUNCTION public.calculate_invoice_totals(p_invoice_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_subtotal NUMERIC := 0;
  v_vat_amount NUMERIC := 0;
  v_total NUMERIC := 0;
  v_vat_rate NUMERIC := 0.20; -- Standard 20% VAT rate
  v_total_minutes INTEGER := 0;
BEGIN
  -- Calculate subtotal and total minutes from line items
  SELECT 
    COALESCE(SUM(line_total), 0),
    COALESCE(SUM(actual_time_minutes), 0)
  INTO v_subtotal, v_total_minutes
  FROM public.invoice_line_items
  WHERE invoice_id = p_invoice_id;
  
  -- Calculate VAT amount
  -- Check if any line items are VATable by looking at their associated rate schedules
  SELECT COALESCE(SUM(
    CASE 
      WHEN crs.is_vatable = true THEN ili.line_total * v_vat_rate
      ELSE 0
    END
  ), 0)
  INTO v_vat_amount
  FROM public.invoice_line_items ili
  LEFT JOIN public.client_rate_schedules crs ON ili.rate_schedule_id = crs.id
  WHERE ili.invoice_id = p_invoice_id;
  
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
$$;