
-- Create the 'work_types' table
CREATE TABLE public.work_types (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.work_types IS 'Stores different types of work or services offered.';

-- Add trigger for 'updated_at' on 'work_types'
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.work_types
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Enable RLS and set policies for 'work_types'
ALTER TABLE public.work_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to all work types"
ON public.work_types FOR SELECT USING (true);

CREATE POLICY "Allow super_admins to manage work types"
ON public.work_types FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Populate the table with initial data
INSERT INTO public.work_types (title, status) VALUES
('Night Shift', 'Active'),
('Companionship', 'Active'),
('Personal Care', 'Active'),
('Manual Handling', 'Active'),
('Weekend Work', 'Active'),
('Bank Holiday Work', 'Active'),
('Medication Support', 'Active'),
('Respite for Carers', 'Active'),
('Learning Disability Support', 'Active'),
('Dementia Support', 'Active'),
('Urgent Responder', 'Active'),
('Fall Responder', 'Active'),
('Clients'' Transport', 'Active'),
('Home Help', 'Active'),
('Meal Preparation', 'Active'),
('Shopping', 'Active');
