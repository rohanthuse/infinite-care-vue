
-- Function to update the 'updated_at' column on row modification
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the 'services' table to store service details
CREATE TABLE public.services (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    double_handed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add a trigger to automatically update the 'updated_at' timestamp
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Enable Row Level Security on the 'services' table
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Policy to allow all authenticated users to view services
CREATE POLICY "Allow public read access to all services"
ON public.services
FOR SELECT
USING (true);

-- Policy to allow super_admins full management access to services
CREATE POLICY "Allow super_admins to manage services"
ON public.services
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Insert the initial set of services into the new table
INSERT INTO public.services (title, category, double_handed, description) VALUES
('Personal Care', 'Daily Support', false, 'Assistance with daily personal tasks.'),
('Medication Assistance', 'Medical', false, 'Ensuring medication is taken on time.'),
('Client Transport', 'Mobility', false, 'Transportation to appointments and errands.'),
('Home and Meal Support', 'Daily Support', false, 'Help with household chores and meal preparation.'),
('Respite for Carers', 'Family Support', false, 'Providing relief for primary caregivers.'),
('Companionship', 'Mental Wellbeing', false, 'Providing social interaction and companionship.'),
('24/7 On-call Support', 'Emergency', false, 'Round-the-clock support for emergencies.'),
('Sleep-in Care', 'Overnight', false, 'Overnight care where the carer sleeps but is on-hand.'),
('Waking Night Care', 'Overnight', false, 'Overnight care where the carer is awake and alert.'),
('Dementia Support', 'Specialized Care', false, 'Specialized care for individuals with dementia.'),
('Learning Disability Support', 'Specialized Care', false, 'Support for individuals with learning disabilities.'),
('Double Handed Care', 'Specialized Care', true, 'Care that requires two carers to be present.'),
('Manual Handling', 'Physical Support', false, 'Assistance with mobility and transfers.'),
('Live-in Care', 'Long-term Support', false, 'Full-time care from a carer who lives at home.'),
('Shopping', 'Daily Support', false, 'Assistance with grocery and other shopping.'),
('Personal Assistance', 'Daily Support', false, 'General personal assistance with various tasks.'),
('Night Only Sleep-In', 'Overnight', false, 'A carer sleeps at the property for a minimum of eight hours and is on hand if required.'),
('Home Support', 'Daily Support', false, 'General support with maintaining the home.'),
('Meal Support', 'Daily Support', false, 'Assistance with preparing and eating meals.');
