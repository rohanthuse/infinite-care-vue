
-- Enhance the staff table to include all necessary fields for carer management
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active',
ADD COLUMN IF NOT EXISTS experience TEXT,
ADD COLUMN IF NOT EXISTS specialization TEXT,
ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'Full-time',
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS hire_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE TRIGGER update_staff_updated_at
    BEFORE UPDATE ON public.staff
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on staff table
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Create policies for staff table
CREATE POLICY "Branch admins can view branch staff" ON public.staff
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_branches ab
            WHERE ab.branch_id = staff.branch_id
            AND ab.admin_id = auth.uid()
        )
    );

CREATE POLICY "Branch admins can insert branch staff" ON public.staff
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_branches ab
            WHERE ab.branch_id = staff.branch_id
            AND ab.admin_id = auth.uid()
        )
    );

CREATE POLICY "Branch admins can update branch staff" ON public.staff
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.admin_branches ab
            WHERE ab.branch_id = staff.branch_id
            AND ab.admin_id = auth.uid()
        )
    );

CREATE POLICY "Branch admins can delete branch staff" ON public.staff
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.admin_branches ab
            WHERE ab.branch_id = staff.branch_id
            AND ab.admin_id = auth.uid()
        )
    );

-- Allow staff to view their own record
CREATE POLICY "Staff can view own record" ON public.staff
    FOR SELECT USING (id = auth.uid());

-- Allow staff to update their own record
CREATE POLICY "Staff can update own record" ON public.staff
    FOR UPDATE USING (id = auth.uid());

-- Create a function to get staff profile data
CREATE OR REPLACE FUNCTION public.get_staff_profile(staff_user_id uuid)
RETURNS TABLE (
    id uuid,
    first_name text,
    last_name text,
    email text,
    phone text,
    address text,
    status text,
    experience text,
    specialization text,
    availability text,
    date_of_birth date,
    hire_date date,
    branch_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.first_name,
        s.last_name,
        s.email,
        s.phone,
        s.address,
        s.status,
        s.experience,
        s.specialization,
        s.availability,
        s.date_of_birth,
        s.hire_date,
        s.branch_id
    FROM public.staff s
    WHERE s.id = staff_user_id;
END;
$$;
