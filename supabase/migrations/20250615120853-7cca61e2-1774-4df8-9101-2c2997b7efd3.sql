
-- Create the 'medical_categories' table
CREATE TABLE public.medical_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.medical_categories IS 'Stores categories for medical and mental health conditions.';

-- Add trigger for 'updated_at' on 'medical_categories'
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.medical_categories
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Enable RLS and set policies for 'medical_categories'
ALTER TABLE public.medical_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to all medical categories"
ON public.medical_categories FOR SELECT USING (true);

CREATE POLICY "Allow super_admins to manage medical categories"
ON public.medical_categories FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));


-- Create the 'medical_conditions' table
CREATE TABLE public.medical_conditions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES public.medical_categories(id) ON DELETE RESTRICT,
    field_caption TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.medical_conditions IS 'Stores medical and mental health conditions.';

-- Add trigger for 'updated_at' on 'medical_conditions'
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.medical_conditions
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Enable RLS and set policies for 'medical_conditions'
ALTER TABLE public.medical_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to all medical conditions"
ON public.medical_conditions FOR SELECT USING (true);

CREATE POLICY "Allow super_admins to manage medical conditions"
ON public.medical_conditions FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));


-- Populate the tables with initial data
DO $$
DECLARE
    medical_category_id UUID;
    mental_category_id UUID;
BEGIN
    -- Insert categories and capture their IDs
    INSERT INTO public.medical_categories (name) VALUES ('Medical Health Conditions') RETURNING id INTO medical_category_id;
    INSERT INTO public.medical_categories (name) VALUES ('Mental Health Conditions') RETURNING id INTO mental_category_id;

    -- Insert conditions using the captured category IDs
    INSERT INTO public.medical_conditions (title, category_id, field_caption) VALUES
    ('Cancer', medical_category_id, 'Type'),
    ('Arthritis', medical_category_id, ''),
    ('Heart Condition', medical_category_id, 'Type'),
    ('Diabetes', medical_category_id, 'Type'),
    ('Chronic Pain', medical_category_id, 'Type'),
    ('Chronic Respiratory', medical_category_id, 'Type'),
    ('Addiction', medical_category_id, 'Type'),
    ('Other Medical Conditions', medical_category_id, 'Type'),
    ('Blood Pressure', medical_category_id, ''),
    ('Thyroid', medical_category_id, ''),
    ('Multiple Sclerosis', medical_category_id, ''),
    ('Parkinson''s', medical_category_id, 'Parkinson''s'),
    ('Dementia', mental_category_id, ''),
    ('Insomnia', mental_category_id, ''),
    ('Anxiety', mental_category_id, '');
END $$;
