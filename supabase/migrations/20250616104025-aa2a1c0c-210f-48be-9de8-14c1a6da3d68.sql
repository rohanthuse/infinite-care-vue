
-- Create client appointments table
CREATE TABLE public.client_appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  appointment_type text NOT NULL,
  provider_name text NOT NULL,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  location text NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create client care plans table
CREATE TABLE public.client_care_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  provider_name text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  review_date date,
  goals_progress integer DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create client care plan goals table
CREATE TABLE public.client_care_plan_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_plan_id uuid NOT NULL REFERENCES public.client_care_plans(id) ON DELETE CASCADE,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'not-started',
  progress integer DEFAULT 0,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create client medications table
CREATE TABLE public.client_medications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_plan_id uuid NOT NULL REFERENCES public.client_care_plans(id) ON DELETE CASCADE,
  name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create client activities table
CREATE TABLE public.client_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_plan_id uuid NOT NULL REFERENCES public.client_care_plans(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  frequency text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create client documents table
CREATE TABLE public.client_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  upload_date date NOT NULL DEFAULT CURRENT_DATE,
  uploaded_by text NOT NULL,
  file_size text,
  file_path text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create client billing table
CREATE TABLE public.client_billing (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  invoice_date date NOT NULL,
  due_date date NOT NULL,
  amount numeric(10,2) NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  paid_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create client payment methods table
CREATE TABLE public.client_payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'credit_card',
  last_four text NOT NULL,
  exp_month integer NOT NULL,
  exp_year integer NOT NULL,
  cardholder_name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all new tables
ALTER TABLE public.client_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_care_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_care_plan_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_payment_methods ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for client appointments
CREATE POLICY "Clients can view their own appointments" 
  ON public.client_appointments 
  FOR SELECT 
  USING (client_id IN (SELECT id FROM public.clients WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Clients can insert their own appointments" 
  ON public.client_appointments 
  FOR INSERT 
  WITH CHECK (client_id IN (SELECT id FROM public.clients WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Clients can update their own appointments" 
  ON public.client_appointments 
  FOR UPDATE 
  USING (client_id IN (SELECT id FROM public.clients WHERE email = auth.jwt() ->> 'email'));

-- Create RLS policies for client care plans
CREATE POLICY "Clients can view their own care plans" 
  ON public.client_care_plans 
  FOR SELECT 
  USING (client_id IN (SELECT id FROM public.clients WHERE email = auth.jwt() ->> 'email'));

-- Create RLS policies for care plan goals
CREATE POLICY "Clients can view their own care plan goals" 
  ON public.client_care_plan_goals 
  FOR SELECT 
  USING (care_plan_id IN (
    SELECT id FROM public.client_care_plans 
    WHERE client_id IN (SELECT id FROM public.clients WHERE email = auth.jwt() ->> 'email')
  ));

-- Create similar policies for other tables
CREATE POLICY "Clients can view their own medications" 
  ON public.client_medications 
  FOR SELECT 
  USING (care_plan_id IN (
    SELECT id FROM public.client_care_plans 
    WHERE client_id IN (SELECT id FROM public.clients WHERE email = auth.jwt() ->> 'email')
  ));

CREATE POLICY "Clients can view their own activities" 
  ON public.client_activities 
  FOR SELECT 
  USING (care_plan_id IN (
    SELECT id FROM public.client_care_plans 
    WHERE client_id IN (SELECT id FROM public.clients WHERE email = auth.jwt() ->> 'email')
  ));

CREATE POLICY "Clients can view their own documents" 
  ON public.client_documents 
  FOR SELECT 
  USING (client_id IN (SELECT id FROM public.clients WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Clients can view their own billing" 
  ON public.client_billing 
  FOR SELECT 
  USING (client_id IN (SELECT id FROM public.clients WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Clients can view their own payment methods" 
  ON public.client_payment_methods 
  FOR SELECT 
  USING (client_id IN (SELECT id FROM public.clients WHERE email = auth.jwt() ->> 'email'));

-- Add some sample data for testing
INSERT INTO public.client_appointments (client_id, appointment_type, provider_name, appointment_date, appointment_time, location, status) VALUES
  ((SELECT id FROM public.clients LIMIT 1), 'Therapy Session', 'Dr. Smith, Physical Therapist', '2025-05-03', '10:00:00', 'Main Clinic, Room 204', 'confirmed'),
  ((SELECT id FROM public.clients LIMIT 1), 'Weekly Check-in', 'Nurse Johnson', '2025-05-10', '14:00:00', 'Video Call', 'confirmed');

INSERT INTO public.client_care_plans (client_id, title, provider_name, start_date, review_date, goals_progress) VALUES
  ((SELECT id FROM public.clients LIMIT 1), 'Rehabilitation Care Plan', 'Dr. Emily Smith', '2025-03-15', '2025-05-25', 65);

INSERT INTO public.client_care_plan_goals (care_plan_id, description, status, progress, notes) VALUES
  ((SELECT id FROM public.client_care_plans LIMIT 1), 'Improve mobility in left leg', 'in-progress', 70, 'Making good progress with physical therapy exercises'),
  ((SELECT id FROM public.client_care_plans LIMIT 1), 'Complete daily exercises', 'in-progress', 85, 'Consistent with morning exercises');

INSERT INTO public.client_billing (client_id, invoice_number, invoice_date, due_date, amount, description, status) VALUES
  ((SELECT id FROM public.clients LIMIT 1), 'INV-2025-0003', '2025-05-01', '2025-05-15', 150.00, 'Weekly therapy sessions (4)', 'pending'),
  ((SELECT id FROM public.clients LIMIT 1), 'INV-2025-0002', '2025-04-01', '2025-04-15', 150.00, 'Weekly therapy sessions (4)', 'paid');
