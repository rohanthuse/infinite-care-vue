-- Phase 1: Critical Organization Isolation Fix for Invoicing System

-- Step 1: Add organization_id to invoice_line_items table if not exists
ALTER TABLE public.invoice_line_items 
ADD COLUMN IF NOT EXISTS organization_id uuid;

-- Step 2: Create function to get organization_id from client
CREATE OR REPLACE FUNCTION public.get_organization_id_from_client(client_id_param uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  org_id uuid;
BEGIN
  SELECT b.organization_id INTO org_id
  FROM public.clients c
  JOIN public.branches b ON c.branch_id = b.id
  WHERE c.id = client_id_param;
  
  RETURN org_id;
END;
$$;

-- Step 3: Populate missing organization_id values in client_billing
UPDATE public.client_billing 
SET organization_id = get_organization_id_from_client(client_id)
WHERE organization_id IS NULL;

-- Step 4: Populate organization_id in invoice_line_items
UPDATE public.invoice_line_items 
SET organization_id = (
  SELECT cb.organization_id 
  FROM public.client_billing cb 
  WHERE cb.id = invoice_line_items.invoice_id
)
WHERE organization_id IS NULL;

-- Step 5: Add NOT NULL constraints after data population
ALTER TABLE public.client_billing 
ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.invoice_line_items 
ALTER COLUMN organization_id SET NOT NULL;

-- Step 6: Create trigger to auto-populate organization_id for new invoices
CREATE OR REPLACE FUNCTION public.set_billing_organization_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := get_organization_id_from_client(NEW.client_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_billing_organization_id_trigger
  BEFORE INSERT OR UPDATE ON public.client_billing
  FOR EACH ROW
  EXECUTE FUNCTION public.set_billing_organization_id();

-- Step 7: Create trigger for invoice_line_items organization_id
CREATE OR REPLACE FUNCTION public.set_line_item_organization_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.client_billing
    WHERE id = NEW.invoice_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_line_item_organization_id_trigger
  BEFORE INSERT OR UPDATE ON public.invoice_line_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_line_item_organization_id();

-- Step 8: Enhanced RLS Policies for client_billing
DROP POLICY IF EXISTS "Admins can delete client billing" ON public.client_billing;
DROP POLICY IF EXISTS "Admins can insert client billing" ON public.client_billing;
DROP POLICY IF EXISTS "Admins can update client billing" ON public.client_billing;
DROP POLICY IF EXISTS "Branch admins can view client billing" ON public.client_billing;
DROP POLICY IF EXISTS "Clients can view their own billing" ON public.client_billing;

-- New organization-aware policies for client_billing
CREATE POLICY "Organization members can view billing"
ON public.client_billing
FOR SELECT
TO authenticated
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Organization members can insert billing"
ON public.client_billing
FOR INSERT
TO authenticated
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Organization members can update billing"
ON public.client_billing
FOR UPDATE
TO authenticated
USING (organization_id = get_user_organization_id(auth.uid()))
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Organization members can delete billing"
ON public.client_billing
FOR DELETE
TO authenticated
USING (organization_id = get_user_organization_id(auth.uid()));

-- Step 9: Enhanced RLS Policies for invoice_line_items
DROP POLICY IF EXISTS "Admins can delete line items" ON public.invoice_line_items;
DROP POLICY IF EXISTS "Admins can insert line items" ON public.invoice_line_items;
DROP POLICY IF EXISTS "Admins can update line items" ON public.invoice_line_items;
DROP POLICY IF EXISTS "Branch admins can view line items" ON public.invoice_line_items;
DROP POLICY IF EXISTS "Clients can view their line items" ON public.invoice_line_items;

-- New organization-aware policies for invoice_line_items
CREATE POLICY "Organization members can view line items"
ON public.invoice_line_items
FOR SELECT
TO authenticated
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Organization members can insert line items"
ON public.invoice_line_items
FOR INSERT
TO authenticated
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Organization members can update line items"
ON public.invoice_line_items
FOR UPDATE
TO authenticated
USING (organization_id = get_user_organization_id(auth.uid()))
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Organization members can delete line items"
ON public.invoice_line_items
FOR DELETE
TO authenticated
USING (organization_id = get_user_organization_id(auth.uid()));

-- Step 10: Enhanced RLS Policies for payment_records
DROP POLICY IF EXISTS "Admins can delete payment records" ON public.payment_records;
DROP POLICY IF EXISTS "Admins can insert payment records" ON public.payment_records;
DROP POLICY IF EXISTS "Admins can update payment records" ON public.payment_records;
DROP POLICY IF EXISTS "Branch admins can view payment records" ON public.payment_records;
DROP POLICY IF EXISTS "Clients can insert payment records for their invoices" ON public.payment_records;
DROP POLICY IF EXISTS "Clients can view their own payment records" ON public.payment_records;

-- New organization-aware policies for payment_records
CREATE POLICY "Organization members can view payment records"
ON public.payment_records
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.client_billing cb
  WHERE cb.id = payment_records.invoice_id
  AND cb.organization_id = get_user_organization_id(auth.uid())
));

CREATE POLICY "Organization members can insert payment records"
ON public.payment_records
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.client_billing cb
  WHERE cb.id = payment_records.invoice_id
  AND cb.organization_id = get_user_organization_id(auth.uid())
));

CREATE POLICY "Organization members can update payment records"
ON public.payment_records
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.client_billing cb
  WHERE cb.id = payment_records.invoice_id
  AND cb.organization_id = get_user_organization_id(auth.uid())
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.client_billing cb
  WHERE cb.id = payment_records.invoice_id
  AND cb.organization_id = get_user_organization_id(auth.uid())
));

CREATE POLICY "Organization members can delete payment records"
ON public.payment_records
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.client_billing cb
  WHERE cb.id = payment_records.invoice_id
  AND cb.organization_id = get_user_organization_id(auth.uid())
));

-- Step 11: Fix currency to GBP and recalculate totals
UPDATE public.client_billing 
SET currency = 'GBP' 
WHERE currency = 'USD' OR currency IS NULL;

-- Step 12: Recalculate invoice totals for consistency
DO $$
DECLARE
  invoice_record RECORD;
BEGIN
  FOR invoice_record IN 
    SELECT id FROM public.client_billing 
    WHERE total_amount IS NULL OR total_amount = 0
  LOOP
    PERFORM public.calculate_invoice_total(invoice_record.id);
  END LOOP;
END $$;

-- Step 13: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_billing_organization_id ON public.client_billing(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_organization_id ON public.invoice_line_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_invoice_organization ON public.payment_records(invoice_id);

-- Step 14: Update get_uninvoiced_bookings function to include organization context
CREATE OR REPLACE FUNCTION public.get_uninvoiced_bookings(branch_id_param uuid DEFAULT NULL::uuid)
RETURNS TABLE(booking_id uuid, client_id uuid, client_name text, service_title text, start_time timestamp with time zone, end_time timestamp with time zone, revenue numeric, days_since_service integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_org_id uuid;
BEGIN
  -- Get user's organization ID
  user_org_id := get_user_organization_id(auth.uid());
  
  RETURN QUERY
  SELECT 
    b.id as booking_id,
    b.client_id,
    CONCAT(c.first_name, ' ', c.last_name) as client_name,
    s.title as service_title,
    b.start_time,
    b.end_time,
    b.revenue,
    EXTRACT(DAY FROM now() - b.end_time)::INTEGER as days_since_service
  FROM public.bookings b
  LEFT JOIN public.clients c ON b.client_id = c.id
  LEFT JOIN public.services s ON b.service_id = s.id
  LEFT JOIN public.branches br ON b.branch_id = br.id
  LEFT JOIN public.client_billing cb ON cb.booking_id = b.id
  WHERE 
    b.end_time < now() -- Service has been completed
    AND cb.id IS NULL -- No invoice exists for this booking
    AND b.status = 'completed' -- Only completed bookings
    AND br.organization_id = user_org_id -- Organization isolation
    AND (branch_id_param IS NULL OR b.branch_id = branch_id_param)
  ORDER BY b.end_time DESC;
END;
$$;