
-- Create the 'hobbies' table to store hobby details
CREATE TABLE public.hobbies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add a trigger to automatically update the 'updated_at' timestamp
-- This uses the function created earlier for the services table.
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.hobbies
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Enable Row Level Security on the 'hobbies' table
ALTER TABLE public.hobbies ENABLE ROW LEVEL SECURITY;

-- Policy to allow all authenticated users to view hobbies
CREATE POLICY "Allow public read access to all hobbies"
ON public.hobbies
FOR SELECT
USING (true);

-- Policy to allow super_admins full management access to hobbies
CREATE POLICY "Allow super_admins to manage hobbies"
ON public.hobbies
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Insert the initial set of hobbies into the new table
INSERT INTO public.hobbies (title, status) VALUES
('Listening to Music', 'Active'),
('Swimming', 'Active'),
('Reading', 'Active'),
('Playing Musical Instruments', 'Active'),
('Dancing', 'Active'),
('Walking', 'Active'),
('Yoga', 'Active'),
('Cooking', 'Active'),
('Knitting', 'Active'),
('Fishing', 'Active'),
('Fishkeeping', 'Active'),
('Photography', 'Active'),
('Mountaineering', 'Active'),
('Watching TV', 'Active'),
('Painting', 'Active'),
('Gardening', 'Active');
