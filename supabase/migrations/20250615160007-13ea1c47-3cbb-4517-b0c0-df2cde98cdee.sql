
-- Create staff table to store carer information
CREATE TABLE public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- Enable RLS
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
-- Allow read access for all authenticated users
CREATE POLICY "Allow authenticated read access to staff" ON public.staff FOR SELECT USING (auth.role() = 'authenticated');


-- Create clients table
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
-- Allow read access for all authenticated users
CREATE POLICY "Allow authenticated read access to clients" ON public.clients FOR SELECT USING (auth.role() = 'authenticated');


-- Create bookings table
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
-- Allow read access for all authenticated users
CREATE POLICY "Allow authenticated read access to bookings" ON public.bookings FOR SELECT USING (auth.role() = 'authenticated');


-- Create staff_documents table
CREATE TABLE public.staff_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    status TEXT NOT NULL, -- e.g., 'Active', 'Expired'
    expiry_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- Enable RLS
ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;
-- Allow read access for all authenticated users
CREATE POLICY "Allow authenticated read access to staff_documents" ON public.staff_documents FOR SELECT USING (auth.role() = 'authenticated');


-- Create reviews table
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
-- Allow read access for all authenticated users
CREATE POLICY "Allow authenticated read access to reviews" ON public.reviews FOR SELECT USING (auth.role() = 'authenticated');

-- Insert sample data for the specific branch
DO $$
DECLARE
    target_branch_id UUID := '9c5613f3-2c87-4492-820d-143f634023bb';
    staff1_id UUID;
    staff2_id UUID;
    client1_id UUID;
    client2_id UUID;
BEGIN
    -- Insert sample staff
    INSERT INTO public.staff (branch_id, first_name, last_name) VALUES (target_branch_id, 'John', 'Doe') RETURNING id INTO staff1_id;
    INSERT INTO public.staff (branch_id, first_name, last_name) VALUES (target_branch_id, 'Jane', 'Smith') RETURNING id INTO staff2_id;

    -- Insert sample clients
    INSERT INTO public.clients (branch_id, first_name, last_name) VALUES (target_branch_id, 'Peter', 'Jones') RETURNING id INTO client1_id;
    INSERT INTO public.clients (branch_id, first_name, last_name) VALUES (target_branch_id, 'Mary', 'Williams') RETURNING id INTO client2_id;

    -- Insert sample bookings for today
    INSERT INTO public.bookings (branch_id, client_id, staff_id, start_time, end_time) VALUES
    (target_branch_id, client1_id, staff1_id, now()::date + interval '9 hours', now()::date + interval '10 hours'),
    (target_branch_id, client2_id, staff2_id, now()::date + interval '11 hours', now()::date + interval '12 hours');

    -- Insert sample expired document
    INSERT INTO public.staff_documents (staff_id, document_type, status, expiry_date) VALUES
    (staff1_id, 'First Aid Certificate', 'Expired', '2025-01-10');

    -- Insert sample reviews
    INSERT INTO public.reviews (branch_id, client_id, staff_id, rating, comment) VALUES
    (target_branch_id, client1_id, staff1_id, 5, 'John was fantastic, very professional.'),
    (target_branch_id, client2_id, staff2_id, 4, 'Jane was great, arrived a bit late though.');
END $$;

