
-- Create tables for all key parameter types

-- Report Types table
CREATE TABLE public.report_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'Active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- File Categories table
CREATE TABLE public.file_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'Active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Bank Holidays table
CREATE TABLE public.bank_holidays (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'Active',
  registered_by text NOT NULL,
  registered_on date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Travel Rates table
CREATE TABLE public.travel_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'Active',
  from_date date NOT NULL,
  rate_per_mile numeric(10,2) NOT NULL,
  rate_per_hour numeric(10,2) NOT NULL,
  user_type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Communication Types table
CREATE TABLE public.communication_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'Active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Expense Types table
CREATE TABLE public.expense_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'Active',
  type text NOT NULL CHECK (type IN ('Increment', 'Decrement')),
  amount numeric(10,2) NOT NULL,
  tax numeric(5,4) NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.report_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_types ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (allow authenticated users to read and write)
CREATE POLICY "Allow authenticated users to manage report_types" ON public.report_types
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage file_categories" ON public.file_categories
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage bank_holidays" ON public.bank_holidays
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage travel_rates" ON public.travel_rates
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage communication_types" ON public.communication_types
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage expense_types" ON public.expense_types
  FOR ALL USING (true) WITH CHECK (true);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_report_types_updated_at BEFORE UPDATE ON public.report_types FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_file_categories_updated_at BEFORE UPDATE ON public.file_categories FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_bank_holidays_updated_at BEFORE UPDATE ON public.bank_holidays FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_travel_rates_updated_at BEFORE UPDATE ON public.travel_rates FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_communication_types_updated_at BEFORE UPDATE ON public.communication_types FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_expense_types_updated_at BEFORE UPDATE ON public.expense_types FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Insert some sample data for each table
INSERT INTO public.report_types (title, status) VALUES 
  ('General', 'Active'),
  ('Diet and Nutrition', 'Active'),
  ('Bowel Movement', 'Active'),
  ('Behavior', 'Active'),
  ('Mood', 'Active'),
  ('Body Map', 'Active'),
  ('Medication', 'Active'),
  ('Transfer', 'Active'),
  ('DNACPR', 'Active'),
  ('Sleeping Pattern', 'Active');

INSERT INTO public.file_categories (title, status) VALUES 
  ('Carers Documents', 'Active'),
  ('Client Documents', 'Active'),
  ('Company Policies', 'Active'),
  ('ID', 'Active'),
  ('Agreements', 'Active');

INSERT INTO public.bank_holidays (title, status, registered_by, registered_on) VALUES 
  ('New Year''s Day', 'Active', 'Admin', '2023-01-01'),
  ('Good Friday', 'Active', 'Admin', '2023-04-07'),
  ('Easter Monday', 'Active', 'Admin', '2023-04-10'),
  ('Early May Bank Holiday', 'Active', 'Admin', '2023-05-01'),
  ('Spring Bank Holiday', 'Active', 'Admin', '2023-05-29');

INSERT INTO public.travel_rates (title, status, from_date, rate_per_mile, rate_per_hour, user_type) VALUES 
  ('Standard Travel Rate', 'Active', '2023-01-01', 0.45, 15.00, 'Carer'),
  ('Manager Travel Rate', 'Active', '2023-01-01', 0.50, 20.00, 'Manager'),
  ('Senior Carer Rate', 'Active', '2023-01-01', 0.48, 18.00, 'Senior Carer');

INSERT INTO public.communication_types (title, status) VALUES 
  ('Cancellation', 'Active'),
  ('Lateness/Delay', 'Active'),
  ('Sickness', 'Active'),
  ('Grievance', 'Active'),
  ('Holiday', 'Active'),
  ('Appraisal', 'Active'),
  ('Disciplinary', 'Active');

INSERT INTO public.expense_types (title, status, type, amount, tax) VALUES 
  ('Mileage', 'Active', 'Increment', 0.45, 0.0000),
  ('Hourly rate', 'Active', 'Increment', 15.00, 0.2000),
  ('Admin deduction', 'Active', 'Decrement', 5.00, 0.0000),
  ('Training fee', 'Active', 'Decrement', 50.00, 0.0000);
