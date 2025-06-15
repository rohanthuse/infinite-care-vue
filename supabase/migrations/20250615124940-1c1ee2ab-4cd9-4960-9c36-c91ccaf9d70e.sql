
-- Create the table for company settings
CREATE TABLE public.company_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    singleton_enforcer boolean NOT NULL DEFAULT true UNIQUE CHECK (singleton_enforcer = true),
    company_name TEXT,
    registration_number TEXT,
    director TEXT,
    country TEXT,
    mobile_number TEXT,
    telephone TEXT,
    address TEXT,
    website TEXT,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Apply the trigger to update the updated_at column on each update
-- This assumes the function 'update_updated_at_column' already exists as per your setup.
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.company_settings
FOR EACH ROW
EXECUTE PROCEDURE public.update_updated_at_column();

-- Add Row Level Security (RLS)
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to view settings
CREATE POLICY "Allow authenticated users to view settings"
ON public.company_settings
FOR SELECT
TO authenticated
USING (true);

-- Create policy for authenticated users to update settings
CREATE POLICY "Allow authenticated users to update settings"
ON public.company_settings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy for authenticated users to insert settings (only if table is empty)
CREATE POLICY "Allow authenticated users to insert settings"
ON public.company_settings
FOR INSERT
TO authenticated
WITH CHECK ( (SELECT count(*) FROM public.company_settings) = 0 );


-- Insert the initial settings data from the current hardcoded values
INSERT INTO public.company_settings (
    company_name,
    registration_number,
    director,
    country,
    mobile_number,
    telephone,
    address,
    website,
    email
) VALUES (
    'Med-Infinite Healthcare Services LTD',
    '15038324',
    'Aderinsola Thomas',
    'England',
    '1908018596',
    '1908018596',
    'Exchange House, 314 Midsummer Blvd MK9 2UB',
    'www.medinfinitehealthcareservices.com',
    'admin@medinfinitehealthcareservices.com'
);
