
-- Phase 1: Create comprehensive accounting database schema

-- Create expenses table
CREATE TABLE public.expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  description text NOT NULL,
  amount numeric(10,2) NOT NULL,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL,
  payment_method text NOT NULL DEFAULT 'cash',
  receipt_url text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  approved_at timestamp with time zone,
  created_by uuid NOT NULL REFERENCES public.staff(id) ON DELETE RESTRICT,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create payroll_records table
CREATE TABLE public.payroll_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  pay_period_start date NOT NULL,
  pay_period_end date NOT NULL,
  regular_hours numeric(5,2) NOT NULL DEFAULT 0,
  overtime_hours numeric(5,2) NOT NULL DEFAULT 0,
  hourly_rate numeric(8,2) NOT NULL,
  overtime_rate numeric(8,2),
  basic_salary numeric(10,2) NOT NULL DEFAULT 0,
  overtime_pay numeric(10,2) NOT NULL DEFAULT 0,
  bonus numeric(10,2) NOT NULL DEFAULT 0,
  gross_pay numeric(10,2) NOT NULL,
  tax_deduction numeric(10,2) NOT NULL DEFAULT 0,
  ni_deduction numeric(10,2) NOT NULL DEFAULT 0,
  pension_deduction numeric(10,2) NOT NULL DEFAULT 0,
  other_deductions numeric(10,2) NOT NULL DEFAULT 0,
  net_pay numeric(10,2) NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending',
  payment_method text NOT NULL DEFAULT 'bank_transfer',
  payment_date date,
  payment_reference text,
  notes text,
  created_by uuid NOT NULL REFERENCES public.staff(id) ON DELETE RESTRICT,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create travel_records table
CREATE TABLE public.travel_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  travel_date date NOT NULL DEFAULT CURRENT_DATE,
  start_location text NOT NULL,
  end_location text NOT NULL,
  distance_miles numeric(6,2) NOT NULL,
  travel_time_minutes integer,
  vehicle_type text NOT NULL DEFAULT 'personal_car',
  mileage_rate numeric(4,2) NOT NULL,
  total_cost numeric(8,2) NOT NULL,
  purpose text NOT NULL,
  receipt_url text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  approved_at timestamp with time zone,
  reimbursed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create service_rates table
CREATE TABLE public.service_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  service_name text NOT NULL,
  service_code text NOT NULL,
  rate_type text NOT NULL DEFAULT 'hourly',
  amount numeric(8,2) NOT NULL,
  currency text NOT NULL DEFAULT 'GBP',
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to date,
  client_type text NOT NULL DEFAULT 'private',
  funding_source text NOT NULL DEFAULT 'self_funded',
  applicable_days text[] NOT NULL DEFAULT ARRAY['monday','tuesday','wednesday','thursday','friday','saturday','sunday'],
  is_default boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  description text,
  created_by uuid NOT NULL REFERENCES public.staff(id) ON DELETE RESTRICT,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(service_code, branch_id, effective_from)
);

-- Create extra_time_records table
CREATE TABLE public.extra_time_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  work_date date NOT NULL,
  scheduled_start_time time NOT NULL,
  scheduled_end_time time NOT NULL,
  actual_start_time time,
  actual_end_time time,
  scheduled_duration_minutes integer NOT NULL,
  actual_duration_minutes integer,
  extra_time_minutes integer NOT NULL DEFAULT 0,
  hourly_rate numeric(8,2) NOT NULL,
  extra_time_rate numeric(8,2),
  total_cost numeric(8,2) NOT NULL DEFAULT 0,
  reason text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  approved_at timestamp with time zone,
  invoiced boolean NOT NULL DEFAULT false,
  invoice_id uuid REFERENCES public.client_billing(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create staff_bank_details table for payroll
CREATE TABLE public.staff_bank_details (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  account_holder_name text NOT NULL,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  sort_code text NOT NULL,
  iban text,
  swift_code text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(staff_id, is_active) -- Only one active bank detail per staff
);

-- Add indexes for better performance
CREATE INDEX idx_expenses_branch_id ON public.expenses(branch_id);
CREATE INDEX idx_expenses_staff_id ON public.expenses(staff_id);
CREATE INDEX idx_expenses_expense_date ON public.expenses(expense_date);
CREATE INDEX idx_expenses_status ON public.expenses(status);

CREATE INDEX idx_payroll_records_branch_id ON public.payroll_records(branch_id);
CREATE INDEX idx_payroll_records_staff_id ON public.payroll_records(staff_id);
CREATE INDEX idx_payroll_records_pay_period ON public.payroll_records(pay_period_start, pay_period_end);
CREATE INDEX idx_payroll_records_payment_status ON public.payroll_records(payment_status);

CREATE INDEX idx_travel_records_branch_id ON public.travel_records(branch_id);
CREATE INDEX idx_travel_records_staff_id ON public.travel_records(staff_id);
CREATE INDEX idx_travel_records_travel_date ON public.travel_records(travel_date);
CREATE INDEX idx_travel_records_status ON public.travel_records(status);

CREATE INDEX idx_service_rates_branch_id ON public.service_rates(branch_id);
CREATE INDEX idx_service_rates_service_code ON public.service_rates(service_code);
CREATE INDEX idx_service_rates_effective_dates ON public.service_rates(effective_from, effective_to);
CREATE INDEX idx_service_rates_status ON public.service_rates(status);

CREATE INDEX idx_extra_time_records_branch_id ON public.extra_time_records(branch_id);
CREATE INDEX idx_extra_time_records_staff_id ON public.extra_time_records(staff_id);
CREATE INDEX idx_extra_time_records_work_date ON public.extra_time_records(work_date);
CREATE INDEX idx_extra_time_records_status ON public.extra_time_records(status);

-- Enable RLS on all new tables
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_time_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_bank_details ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Allow authenticated users to read expenses" ON public.expenses
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert expenses" ON public.expenses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update expenses" ON public.expenses
  FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated users to delete expenses" ON public.expenses
  FOR DELETE USING (true);

CREATE POLICY "Allow authenticated users to read payroll records" ON public.payroll_records
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert payroll records" ON public.payroll_records
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update payroll records" ON public.payroll_records
  FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated users to read travel records" ON public.travel_records
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert travel records" ON public.travel_records
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update travel records" ON public.travel_records
  FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated users to delete travel records" ON public.travel_records
  FOR DELETE USING (true);

CREATE POLICY "Allow authenticated users to read service rates" ON public.service_rates
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert service rates" ON public.service_rates
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update service rates" ON public.service_rates
  FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated users to delete service rates" ON public.service_rates
  FOR DELETE USING (true);

CREATE POLICY "Allow authenticated users to read extra time records" ON public.extra_time_records
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert extra time records" ON public.extra_time_records
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update extra time records" ON public.extra_time_records
  FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated users to delete extra time records" ON public.extra_time_records
  FOR DELETE USING (true);

CREATE POLICY "Allow authenticated users to read staff bank details" ON public.staff_bank_details
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert staff bank details" ON public.staff_bank_details
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update staff bank details" ON public.staff_bank_details
  FOR UPDATE USING (true);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_payroll_records_updated_at BEFORE UPDATE ON public.payroll_records FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_travel_records_updated_at BEFORE UPDATE ON public.travel_records FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_service_rates_updated_at BEFORE UPDATE ON public.service_rates FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_extra_time_records_updated_at BEFORE UPDATE ON public.extra_time_records FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_staff_bank_details_updated_at BEFORE UPDATE ON public.staff_bank_details FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
