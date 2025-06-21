
-- Create the scheduled_agreements table
CREATE TABLE IF NOT EXISTS public.scheduled_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  scheduled_with_name TEXT,
  scheduled_with_client_id UUID REFERENCES public.clients(id),
  scheduled_with_staff_id UUID REFERENCES public.staff(id),
  type_id UUID REFERENCES public.agreement_types(id),
  template_id UUID REFERENCES public.agreement_templates(id),
  status TEXT NOT NULL DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Pending Approval', 'Under Review', 'Completed', 'Cancelled')),
  notes TEXT,
  branch_id UUID REFERENCES public.branches(id),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on scheduled_agreements
ALTER TABLE public.scheduled_agreements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for scheduled_agreements
CREATE POLICY "Users can view scheduled agreements for their branch" 
  ON public.scheduled_agreements 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create scheduled agreements" 
  ON public.scheduled_agreements 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update scheduled agreements" 
  ON public.scheduled_agreements 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete scheduled agreements" 
  ON public.scheduled_agreements 
  FOR DELETE 
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_scheduled_agreements_updated_at
  BEFORE UPDATE ON public.scheduled_agreements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create clients table if it doesn't exist (for reference)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  branch_id UUID REFERENCES public.branches(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create staff table if it doesn't exist (for reference)
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  branch_id UUID REFERENCES public.branches(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert some sample data for testing
INSERT INTO public.scheduled_agreements (title, scheduled_for, scheduled_with_name, status, type_id, notes, branch_id)
VALUES 
  ('Employment Contract Review', now() + interval '7 days', 'Aderinsola Thomas', 'Upcoming', (SELECT id FROM public.agreement_types LIMIT 1), 'Annual review of employment terms', '9c5613f3-2c87-4492-820d-143f634023bb'),
  ('Service Agreement Renewal', now() + interval '14 days', 'James Wilson', 'Upcoming', (SELECT id FROM public.agreement_types LIMIT 1), 'Discuss updated service terms and pricing', '9c5613f3-2c87-4492-820d-143f634023bb'),
  ('Non-Disclosure Agreement', now() + interval '21 days', 'Sophia Martinez', 'Upcoming', (SELECT id FROM public.agreement_types LIMIT 1), 'New partner onboarding', '9c5613f3-2c87-4492-820d-143f634023bb');
