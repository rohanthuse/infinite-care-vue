
-- Create an ENUM type for agreement party
CREATE TYPE public.agreement_party AS ENUM ('client', 'staff', 'other');

-- Create an ENUM type for agreement status
CREATE TYPE public.agreement_status AS ENUM ('Active', 'Pending', 'Expired', 'Terminated');

-- Create an ENUM type for scheduled agreement status
CREATE TYPE public.scheduled_agreement_status AS ENUM ('Upcoming', 'Pending Approval', 'Under Review', 'Completed', 'Cancelled');

-- Create the table for agreement types
CREATE TABLE public.agreement_types (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS for agreement_types
ALTER TABLE public.agreement_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to view types" ON public.agreement_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin to manage types" ON public.agreement_types FOR ALL TO authenticated USING (true); -- Simplified for now

-- Add trigger for updated_at on agreement_types
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.agreement_types
FOR EACH ROW
EXECUTE PROCEDURE public.update_updated_at_column();

-- Insert default agreement types
INSERT INTO public.agreement_types (name) VALUES
('Employment Agreement'),
('Service Agreement'),
('NDA'),
('Data Agreement');

-- Create the table for agreement templates
CREATE TABLE public.agreement_templates (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    type_id uuid REFERENCES public.agreement_types(id) ON DELETE SET NULL,
    branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    usage_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS for agreement_templates
ALTER TABLE public.agreement_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage templates" ON public.agreement_templates FOR ALL TO authenticated USING (true);

-- Add trigger for updated_at on agreement_templates
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.agreement_templates
FOR EACH ROW
EXECUTE PROCEDURE public.update_updated_at_column();

-- Create the table for signed agreements
CREATE TABLE public.agreements (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    template_id uuid REFERENCES public.agreement_templates(id) ON DELETE SET NULL,
    type_id uuid REFERENCES public.agreement_types(id) ON DELETE SET NULL,
    status public.agreement_status NOT NULL DEFAULT 'Pending',
    signed_by_name TEXT,
    signed_by_client_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    signed_by_staff_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    signing_party public.agreement_party,
    signed_at TIMESTAMPTZ,
    digital_signature TEXT,
    branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS for agreements
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage agreements" ON public.agreements FOR ALL TO authenticated USING (true);

-- Add trigger for updated_at on agreements
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.agreements
FOR EACH ROW
EXECUTE PROCEDURE public.update_updated_at_column();

-- Create the table for scheduled agreements
CREATE TABLE public.scheduled_agreements (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    template_id uuid REFERENCES public.agreement_templates(id) ON DELETE SET NULL,
    type_id uuid REFERENCES public.agreement_types(id) ON DELETE SET NULL,
    scheduled_for TIMESTAMPTZ,
    scheduled_with_name TEXT,
    scheduled_with_client_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    scheduled_with_staff_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    status public.scheduled_agreement_status NOT NULL DEFAULT 'Upcoming',
    notes TEXT,
    branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS for scheduled_agreements
ALTER TABLE public.scheduled_agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage scheduled agreements" ON public.scheduled_agreements FOR ALL TO authenticated USING (true);

-- Add trigger for updated_at on scheduled_agreements
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.scheduled_agreements
FOR EACH ROW
EXECUTE PROCEDURE public.update_updated_at_column();

