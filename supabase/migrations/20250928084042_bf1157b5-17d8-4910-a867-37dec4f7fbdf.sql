-- Drop existing status constraint and fix the invoicing schema

-- Drop any existing check constraints on status
ALTER TABLE public.client_billing 
DROP CONSTRAINT IF EXISTS client_billing_status_check;

-- First, update existing data to match new constraints
UPDATE public.client_billing 
SET status = 'confirmed' 
WHERE status = 'sent';

-- Add missing fields to client_billing table (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_billing' AND column_name = 'start_date') THEN
    ALTER TABLE public.client_billing ADD COLUMN start_date date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_billing' AND column_name = 'end_date') THEN
    ALTER TABLE public.client_billing ADD COLUMN end_date date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_billing' AND column_name = 'booked_time_minutes') THEN
    ALTER TABLE public.client_billing ADD COLUMN booked_time_minutes integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_billing' AND column_name = 'actual_time_minutes') THEN
    ALTER TABLE public.client_billing ADD COLUMN actual_time_minutes integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_billing' AND column_name = 'pay_method') THEN
    ALTER TABLE public.client_billing ADD COLUMN pay_method text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_billing' AND column_name = 'authority_type') THEN
    ALTER TABLE public.client_billing ADD COLUMN authority_type text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_billing' AND column_name = 'invoice_method') THEN
    ALTER TABLE public.client_billing ADD COLUMN invoice_method text DEFAULT 'per_visit';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_billing' AND column_name = 'client_group_id') THEN
    ALTER TABLE public.client_billing ADD COLUMN client_group_id uuid;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_billing' AND column_name = 'is_ready_to_send') THEN
    ALTER TABLE public.client_billing ADD COLUMN is_ready_to_send boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_billing' AND column_name = 'is_former_client') THEN
    ALTER TABLE public.client_billing ADD COLUMN is_former_client boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_billing' AND column_name = 'is_locked') THEN
    ALTER TABLE public.client_billing ADD COLUMN is_locked boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_billing' AND column_name = 'locked_at') THEN
    ALTER TABLE public.client_billing ADD COLUMN locked_at timestamp with time zone;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_billing' AND column_name = 'locked_by') THEN
    ALTER TABLE public.client_billing ADD COLUMN locked_by uuid;
  END IF;
END $$;

-- Create client_groups table
CREATE TABLE IF NOT EXISTS public.client_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  branch_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  status text NOT NULL DEFAULT 'active'
);

-- Enable RLS for client_groups
ALTER TABLE public.client_groups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for client_groups
DROP POLICY IF EXISTS "Organization members can manage client groups" ON public.client_groups;
CREATE POLICY "Organization members can manage client groups"
ON public.client_groups
FOR ALL
USING (organization_id = get_user_organization_id(auth.uid()))
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

-- Create invoice_periods table for tracking service periods
CREATE TABLE IF NOT EXISTS public.invoice_periods (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid NOT NULL REFERENCES public.client_billing(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  service_hours numeric DEFAULT 0,
  rate_applied numeric DEFAULT 0,
  multiplier numeric DEFAULT 1.0,
  is_bank_holiday boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for invoice_periods
ALTER TABLE public.invoice_periods ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for invoice_periods
DROP POLICY IF EXISTS "Organization members can manage invoice periods" ON public.invoice_periods;
CREATE POLICY "Organization members can manage invoice periods"
ON public.invoice_periods
FOR ALL
USING (
  invoice_id IN (
    SELECT cb.id FROM public.client_billing cb
    WHERE cb.organization_id = get_user_organization_id(auth.uid())
  )
)
WITH CHECK (
  invoice_id IN (
    SELECT cb.id FROM public.client_billing cb
    WHERE cb.organization_id = get_user_organization_id(auth.uid())
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_billing_period ON public.client_billing(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_client_billing_status ON public.client_billing(status);
CREATE INDEX IF NOT EXISTS idx_client_billing_pay_method ON public.client_billing(pay_method);
CREATE INDEX IF NOT EXISTS idx_client_billing_authority ON public.client_billing(authority_type);
CREATE INDEX IF NOT EXISTS idx_client_billing_ready_to_send ON public.client_billing(is_ready_to_send);

-- Create function to automatically lock confirmed invoices
CREATE OR REPLACE FUNCTION public.auto_lock_confirmed_invoice()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-lock when status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    NEW.is_locked = true;
    NEW.locked_at = now();
    NEW.locked_by = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-locking
DROP TRIGGER IF EXISTS trigger_auto_lock_confirmed_invoice ON public.client_billing;
CREATE TRIGGER trigger_auto_lock_confirmed_invoice
  BEFORE UPDATE ON public.client_billing
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_lock_confirmed_invoice();

-- Create function for client groups timestamp update
CREATE OR REPLACE FUNCTION public.update_client_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_client_groups_updated_at ON public.client_groups;
CREATE TRIGGER update_client_groups_updated_at
  BEFORE UPDATE ON public.client_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_groups_updated_at();