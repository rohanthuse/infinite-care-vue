
ALTER TABLE public.clients
ADD COLUMN title TEXT,
ADD COLUMN middle_name TEXT,
ADD COLUMN preferred_name TEXT,
ADD COLUMN gender TEXT,
ADD COLUMN pronouns TEXT,
ADD COLUMN date_of_birth DATE,
ADD COLUMN country_code TEXT,
ADD COLUMN mobile_number TEXT,
ADD COLUMN telephone_number TEXT,
ADD COLUMN referral_route TEXT,
ADD COLUMN other_identifier TEXT,
ADD COLUMN additional_information TEXT;
