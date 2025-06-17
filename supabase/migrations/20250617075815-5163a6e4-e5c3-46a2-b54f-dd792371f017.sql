
-- Extend client_billing table with comprehensive invoicing fields
ALTER TABLE public.client_billing ADD COLUMN IF NOT EXISTS service_provided_date DATE;
ALTER TABLE public.client_billing ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.bookings(id);
ALTER TABLE public.client_billing ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0;
ALTER TABLE public.client_billing ADD COLUMN IF NOT EXISTS total_amount NUMERIC;
ALTER TABLE public.client_billing ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE public.client_billing ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT '30 days';
ALTER TABLE public.client_billing ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.client_billing ADD COLUMN IF NOT EXISTS invoice_type TEXT DEFAULT 'manual' CHECK (invoice_type IN ('manual', 'automatic'));
ALTER TABLE public.client_billing ADD COLUMN IF NOT EXISTS generated_from_booking BOOLEAN DEFAULT false;
ALTER TABLE public.client_billing ADD COLUMN IF NOT EXISTS sent_date DATE;
ALTER TABLE public.client_billing ADD COLUMN IF NOT EXISTS overdue_date DATE;

-- Update status to support more comprehensive workflow
ALTER TABLE public.client_billing DROP CONSTRAINT IF EXISTS client_billing_status_check;
ALTER TABLE public.client_billing ADD CONSTRAINT client_billing_status_check 
  CHECK (status IN ('draft', 'sent', 'pending', 'paid', 'overdue', 'cancelled', 'refunded'));

-- Create invoice_line_items table for detailed billing
CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.client_billing(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id),
  description TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  discount_amount NUMERIC DEFAULT 0,
  line_total NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment_records table for tracking payments
CREATE TABLE IF NOT EXISTS public.payment_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.client_billing(id) ON DELETE CASCADE,
  payment_amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'online', 'check')),
  transaction_id TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create triggers for updated_at columns
CREATE OR REPLACE TRIGGER update_invoice_line_items_updated_at
  BEFORE UPDATE ON public.invoice_line_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_payment_records_updated_at
  BEFORE UPDATE ON public.payment_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create RLS policies for new tables
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- Policies for invoice_line_items
CREATE POLICY "Users can view invoice line items" ON public.invoice_line_items
  FOR SELECT USING (true);

CREATE POLICY "Users can insert invoice line items" ON public.invoice_line_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update invoice line items" ON public.invoice_line_items
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete invoice line items" ON public.invoice_line_items
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Policies for payment_records
CREATE POLICY "Users can view payment records" ON public.payment_records
  FOR SELECT USING (true);

CREATE POLICY "Users can insert payment records" ON public.payment_records
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update payment records" ON public.payment_records
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete payment records" ON public.payment_records
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Function to automatically calculate invoice totals
CREATE OR REPLACE FUNCTION public.calculate_invoice_total(invoice_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  subtotal NUMERIC := 0;
  tax_amt NUMERIC := 0;
  total NUMERIC := 0;
BEGIN
  -- Calculate subtotal from line items
  SELECT COALESCE(SUM(line_total), 0) INTO subtotal
  FROM public.invoice_line_items
  WHERE invoice_line_items.invoice_id = calculate_invoice_total.invoice_id;
  
  -- Get tax amount from invoice
  SELECT COALESCE(tax_amount, 0) INTO tax_amt
  FROM public.client_billing
  WHERE id = calculate_invoice_total.invoice_id;
  
  -- Calculate total
  total := subtotal + tax_amt;
  
  -- Update the invoice with calculated amounts
  UPDATE public.client_billing
  SET amount = subtotal, total_amount = total, updated_at = now()
  WHERE id = calculate_invoice_total.invoice_id;
  
  RETURN total;
END;
$$;

-- Function to check for uninvoiced services
CREATE OR REPLACE FUNCTION public.get_uninvoiced_bookings(branch_id_param UUID DEFAULT NULL)
RETURNS TABLE (
  booking_id UUID,
  client_id UUID,
  client_name TEXT,
  service_title TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  revenue NUMERIC,
  days_since_service INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
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
  LEFT JOIN public.client_billing cb ON cb.booking_id = b.id
  WHERE 
    b.end_time < now() -- Service has been completed
    AND cb.id IS NULL -- No invoice exists for this booking
    AND b.status = 'completed' -- Only completed bookings
    AND (branch_id_param IS NULL OR b.branch_id = branch_id_param)
  ORDER BY b.end_time DESC;
END;
$$;
