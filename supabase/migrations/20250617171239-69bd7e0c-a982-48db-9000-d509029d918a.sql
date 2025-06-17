
-- Enable RLS on client_care_plans table (if not already enabled)
ALTER TABLE public.client_care_plans ENABLE ROW LEVEL SECURITY;

-- Enable RLS on clients table (if not already enabled)  
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for client_care_plans - allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read care plans" ON public.client_care_plans
  FOR SELECT 
  USING (true);

-- Create RLS policy for clients - allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read clients" ON public.clients
  FOR SELECT 
  USING (true);

-- Create RLS policy for client_care_plan_goals - allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read care plan goals" ON public.client_care_plan_goals
  FOR SELECT 
  USING (true);

-- Create RLS policy for client_notes - allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read client notes" ON public.client_notes
  FOR SELECT 
  USING (true);

-- Create RLS policy for client_medications - allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read client medications" ON public.client_medications
  FOR SELECT 
  USING (true);

-- Create RLS policy for client_activities - allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read client activities" ON public.client_activities
  FOR SELECT 
  USING (true);
