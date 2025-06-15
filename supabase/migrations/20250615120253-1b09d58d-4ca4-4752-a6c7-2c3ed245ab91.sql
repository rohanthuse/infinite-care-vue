
-- Create the 'skills' table to store skill details
CREATE TABLE public.skills (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    explanation TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add a comment to the table for clarity
COMMENT ON TABLE public.skills IS 'Stores soft skills and their explanations for caregivers.';

-- Add a trigger to automatically update the 'updated_at' timestamp
-- This uses the existing function 'update_updated_at_column'.
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.skills
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Enable Row Level Security on the 'skills' table
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- Policy to allow all users to view skills
CREATE POLICY "Allow public read access to all skills"
ON public.skills
FOR SELECT
USING (true);

-- Policy to allow super_admins full management access to skills
CREATE POLICY "Allow super_admins to manage skills"
ON public.skills
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Insert the initial set of skills from the mock data into the new table
INSERT INTO public.skills (name, explanation, status) VALUES
('Patience', '', 'Active'),
('Pleasant', '', 'Active'),
('Friendly', '', 'Active'),
('Personable', '', 'Active'),
('Cheerful', '', 'Active'),
('Ability to multi-task', '', 'Active'),
('Ability to think quickly', '', 'Active'),
('Punctual', '', 'Active'),
('A good listener', '', 'Active'),
('Empathetic', '', 'Active'),
('Kind', '', 'Active'),
('Ability to take responsibility', '', 'Active'),
('Willingness to go the extra mile', '', 'Active'),
('Knowledge of dementia', '', 'Active'),
('Communication skills', '', 'Active');

