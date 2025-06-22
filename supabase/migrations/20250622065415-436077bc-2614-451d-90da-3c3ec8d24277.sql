
-- Update RLS policies for staff table to allow both super_admin and branch_admin access

-- Drop existing policies
DROP POLICY IF EXISTS "Branch admins can update branch staff" ON public.staff;
DROP POLICY IF EXISTS "Branch admins can view branch staff" ON public.staff;
DROP POLICY IF EXISTS "Branch admins can insert branch staff" ON public.staff;
DROP POLICY IF EXISTS "Branch admins can delete branch staff" ON public.staff;

-- Create updated policies that support both super_admin and branch_admin roles

-- View/Select policy
CREATE POLICY "Admins can view staff" ON public.staff
    FOR SELECT USING (
        -- Super admins can view all staff
        public.has_role(auth.uid(), 'super_admin') OR
        -- Branch admins can view staff in their assigned branches
        (public.has_role(auth.uid(), 'branch_admin') AND EXISTS (
            SELECT 1 FROM public.admin_branches ab
            WHERE ab.branch_id = staff.branch_id
            AND ab.admin_id = auth.uid()
        )) OR
        -- Staff can view their own record
        id = auth.uid()
    );

-- Insert policy
CREATE POLICY "Admins can insert staff" ON public.staff
    FOR INSERT WITH CHECK (
        -- Super admins can insert staff anywhere
        public.has_role(auth.uid(), 'super_admin') OR
        -- Branch admins can insert staff in their assigned branches
        (public.has_role(auth.uid(), 'branch_admin') AND EXISTS (
            SELECT 1 FROM public.admin_branches ab
            WHERE ab.branch_id = staff.branch_id
            AND ab.admin_id = auth.uid()
        ))
    );

-- Update policy
CREATE POLICY "Admins can update staff" ON public.staff
    FOR UPDATE USING (
        -- Super admins can update all staff
        public.has_role(auth.uid(), 'super_admin') OR
        -- Branch admins can update staff in their assigned branches
        (public.has_role(auth.uid(), 'branch_admin') AND EXISTS (
            SELECT 1 FROM public.admin_branches ab
            WHERE ab.branch_id = staff.branch_id
            AND ab.admin_id = auth.uid()
        )) OR
        -- Staff can update their own record
        id = auth.uid()
    );

-- Delete policy
CREATE POLICY "Admins can delete staff" ON public.staff
    FOR DELETE USING (
        -- Super admins can delete all staff
        public.has_role(auth.uid(), 'super_admin') OR
        -- Branch admins can delete staff in their assigned branches
        (public.has_role(auth.uid(), 'branch_admin') AND EXISTS (
            SELECT 1 FROM public.admin_branches ab
            WHERE ab.branch_id = staff.branch_id
            AND ab.admin_id = auth.uid()
        ))
    );
