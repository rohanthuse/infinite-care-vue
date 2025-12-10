-- Phase 3: Add travel_payment_type to staff table
-- This allows staff to choose between being paid for mileage or travel time

ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS travel_payment_type TEXT 
CHECK (travel_payment_type IN ('pay_mileage', 'pay_travel_time', 'none'));

-- Add default value comment
COMMENT ON COLUMN public.staff.travel_payment_type IS 'Determines how staff is compensated for travel: pay_mileage, pay_travel_time, or none';

-- Create invoice_expense_entries table to link expenses to invoices
CREATE TABLE IF NOT EXISTS public.invoice_expense_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.client_billing(id) ON DELETE CASCADE,
  expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  expense_type_id UUID NOT NULL,
  expense_type_name TEXT NOT NULL,
  date DATE,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  admin_cost_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
  description TEXT,
  pay_staff BOOLEAN DEFAULT false,
  staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  staff_name TEXT,
  pay_staff_amount NUMERIC(10, 2),
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on invoice_expense_entries
ALTER TABLE public.invoice_expense_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view invoice expense entries" 
ON public.invoice_expense_entries 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create invoice expense entries" 
ON public.invoice_expense_entries 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update invoice expense entries" 
ON public.invoice_expense_entries 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete invoice expense entries" 
ON public.invoice_expense_entries 
FOR DELETE 
USING (true);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoice_expense_entries_invoice_id ON public.invoice_expense_entries(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_expense_entries_expense_id ON public.invoice_expense_entries(expense_id);

-- Add rejection_reason columns
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.travel_records ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.extra_time_records ADD COLUMN IF NOT EXISTS rejection_reason TEXT;