-- Phase 1: Database Schema Extensions for Client Rate & Accounting Configuration

-- Extend service_rates table with new fields
ALTER TABLE public.service_rates ADD COLUMN IF NOT EXISTS time_from time;
ALTER TABLE public.service_rates ADD COLUMN IF NOT EXISTS time_until time;
ALTER TABLE public.service_rates ADD COLUMN IF NOT EXISTS rate_category text DEFAULT 'standard' CHECK (rate_category IN ('standard', 'adult', 'cyp'));
ALTER TABLE public.service_rates ADD COLUMN IF NOT EXISTS pay_based_on text DEFAULT 'service' CHECK (pay_based_on IN ('service', 'hours_minutes', 'daily_flat_rate'));
ALTER TABLE public.service_rates ADD COLUMN IF NOT EXISTS charge_type text DEFAULT 'hourly_rate' CHECK (charge_type IN ('flat_rate', 'pro_rata', 'hourly_rate', 'hour_minutes', 'rate_per_hour', 'rate_per_minutes_pro_rata', 'rate_per_minutes_flat_rate', 'daily_flat_rate'));
ALTER TABLE public.service_rates ADD COLUMN IF NOT EXISTS rate_15_minutes numeric(10,2);
ALTER TABLE public.service_rates ADD COLUMN IF NOT EXISTS rate_30_minutes numeric(10,2);
ALTER TABLE public.service_rates ADD COLUMN IF NOT EXISTS rate_45_minutes numeric(10,2);
ALTER TABLE public.service_rates ADD COLUMN IF NOT EXISTS rate_60_minutes numeric(10,2);
ALTER TABLE public.service_rates ADD COLUMN IF NOT EXISTS consecutive_hours numeric(10,2);
ALTER TABLE public.service_rates ADD COLUMN IF NOT EXISTS bank_holiday_multiplier numeric(3,2) DEFAULT 1.0;
ALTER TABLE public.service_rates ADD COLUMN IF NOT EXISTS mileage_excluded boolean DEFAULT false;
ALTER TABLE public.service_rates ADD COLUMN IF NOT EXISTS service_type text;

-- Create client_accounting_settings table
CREATE TABLE IF NOT EXISTS public.client_accounting_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  care_lead_id uuid REFERENCES public.staff(id),
  agreement_type text,
  expiry_date date,
  show_in_task_matrix boolean DEFAULT false,
  show_in_form_matrix boolean DEFAULT false,
  enable_geo_fencing boolean DEFAULT false,
  invoice_method text DEFAULT 'per_visit' CHECK (invoice_method IN ('per_visit', 'weekly', 'monthly')),
  invoice_display_type text DEFAULT 'per_visit',
  billing_address_same_as_personal boolean DEFAULT true,
  pay_method text,
  rate_type text DEFAULT 'standard' CHECK (rate_type IN ('standard', 'adult', 'cyp')),
  mileage_rule_no_payment boolean DEFAULT false,
  service_payer text DEFAULT 'authorities' CHECK (service_payer IN ('authorities', 'direct_payment', 'self_funder', 'other')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  branch_id uuid REFERENCES public.branches(id),
  organization_id uuid
);

-- Create client_private_accounting table
CREATE TABLE IF NOT EXISTS public.client_private_accounting (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  private_invoice_config text,
  charge_based_on text DEFAULT 'planned_time' CHECK (charge_based_on IN ('planned_time', 'actual_time')),
  extra_time_calculation boolean DEFAULT false,
  travel_rate_id uuid REFERENCES public.travel_rates(id),
  credit_period_days integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  branch_id uuid REFERENCES public.branches(id),
  organization_id uuid
);

-- Create service_types table for standardized service categories
CREATE TABLE IF NOT EXISTS public.service_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert standard service types
INSERT INTO public.service_types (name, code, description) VALUES
('Personal Care', 'personal_care', 'Personal hygiene, dressing, and daily care assistance'),
('Medication Assistance', 'medication_assistance', 'Help with medication management and administration'),
('Client Transport', 'client_transport', 'Transportation services for clients'),
('Home and Meal Support', 'home_meal_support', 'Household tasks and meal preparation'),
('Respite for Carers', 'respite_care', 'Temporary relief care for primary carers'),
('Companionship', 'companionship', 'Social interaction and emotional support'),
('24/7 On-call Support', 'on_call_support', 'Round-the-clock emergency support')
ON CONFLICT (code) DO NOTHING;

-- Create client_rate_schedules table for complex rate configurations
CREATE TABLE IF NOT EXISTS public.client_rate_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_type_code text REFERENCES public.service_types(code),
  authority_type text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  days_covered text[] NOT NULL DEFAULT '{}', -- ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  time_from time NOT NULL,
  time_until time NOT NULL,
  rate_category text DEFAULT 'standard' CHECK (rate_category IN ('standard', 'adult', 'cyp')),
  pay_based_on text DEFAULT 'service' CHECK (pay_based_on IN ('service', 'hours_minutes', 'daily_flat_rate')),
  charge_type text DEFAULT 'hourly_rate' CHECK (charge_type IN ('flat_rate', 'pro_rata', 'hourly_rate', 'hour_minutes', 'rate_per_hour', 'rate_per_minutes_pro_rata', 'rate_per_minutes_flat_rate', 'daily_flat_rate')),
  base_rate numeric(10,2) NOT NULL,
  rate_15_minutes numeric(10,2),
  rate_30_minutes numeric(10,2),
  rate_45_minutes numeric(10,2),
  rate_60_minutes numeric(10,2),
  consecutive_hours_rate numeric(10,2),
  bank_holiday_multiplier numeric(3,2) DEFAULT 1.0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  branch_id uuid REFERENCES public.branches(id),
  organization_id uuid
);

-- Add RLS policies for new tables
ALTER TABLE public.client_accounting_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_private_accounting ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_rate_schedules ENABLE ROW LEVEL SECURITY;

-- RLS policies for client_accounting_settings
CREATE POLICY "Organization members can manage client accounting settings" ON public.client_accounting_settings
FOR ALL USING (organization_id = get_user_organization_id(auth.uid()))
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

-- RLS policies for client_private_accounting
CREATE POLICY "Organization members can manage client private accounting" ON public.client_private_accounting
FOR ALL USING (organization_id = get_user_organization_id(auth.uid()))
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

-- RLS policies for service_types
CREATE POLICY "Everyone can view service types" ON public.service_types
FOR SELECT USING (true);

CREATE POLICY "Admins can manage service types" ON public.service_types
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS policies for client_rate_schedules
CREATE POLICY "Organization members can manage client rate schedules" ON public.client_rate_schedules
FOR ALL USING (organization_id = get_user_organization_id(auth.uid()))
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

-- Add triggers to set organization_id automatically
CREATE OR REPLACE FUNCTION public.set_client_accounting_organization_id()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT b.organization_id INTO NEW.organization_id
    FROM public.branches b
    WHERE b.id = NEW.branch_id;
    
    -- If branch_id is not set, get it from client
    IF NEW.organization_id IS NULL AND NEW.client_id IS NOT NULL THEN
      SELECT b.organization_id, c.branch_id INTO NEW.organization_id, NEW.branch_id
      FROM public.clients c
      JOIN public.branches b ON c.branch_id = b.id
      WHERE c.id = NEW.client_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Apply triggers
CREATE TRIGGER set_client_accounting_settings_organization_id
  BEFORE INSERT OR UPDATE ON public.client_accounting_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_client_accounting_organization_id();

CREATE TRIGGER set_client_private_accounting_organization_id
  BEFORE INSERT OR UPDATE ON public.client_private_accounting
  FOR EACH ROW EXECUTE FUNCTION public.set_client_accounting_organization_id();

CREATE TRIGGER set_client_rate_schedules_organization_id
  BEFORE INSERT OR UPDATE ON public.client_rate_schedules
  FOR EACH ROW EXECUTE FUNCTION public.set_client_accounting_organization_id();