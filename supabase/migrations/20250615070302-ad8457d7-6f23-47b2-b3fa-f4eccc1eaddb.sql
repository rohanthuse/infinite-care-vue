
-- Add 'super_admin' to the app_role enum type, if it doesn't already exist.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'app_role'::regtype AND enumlabel = 'super_admin') THEN
        ALTER TYPE public.app_role ADD VALUE 'super_admin';
    END IF;
END
$$;

-- Create a new table to store granular admin permissions
CREATE TABLE public.admin_permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    
    -- Branch Settings
    system BOOLEAN NOT NULL DEFAULT TRUE,
    finance BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Care Plan
    under_review_care_plan BOOLEAN NOT NULL DEFAULT TRUE,
    confirmed_care_plan BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Reviews
    reviews BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Third Party
    third_party BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Branch Report
    report_accounting BOOLEAN NOT NULL DEFAULT TRUE,
    report_total_working_hours BOOLEAN NOT NULL DEFAULT TRUE,
    report_staff BOOLEAN NOT NULL DEFAULT TRUE,
    report_client BOOLEAN NOT NULL DEFAULT TRUE,
    report_service BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Accounting
    accounting_extra_time BOOLEAN NOT NULL DEFAULT TRUE,
    accounting_expense BOOLEAN NOT NULL DEFAULT TRUE,
    accounting_travel BOOLEAN NOT NULL DEFAULT TRUE,
    accounting_invoices BOOLEAN NOT NULL DEFAULT TRUE,
    accounting_gross_payslip BOOLEAN NOT NULL DEFAULT TRUE,
    accounting_travel_management BOOLEAN NOT NULL DEFAULT TRUE,
    accounting_client_rate BOOLEAN NOT NULL DEFAULT TRUE,
    accounting_authority_rate BOOLEAN NOT NULL DEFAULT TRUE,
    accounting_staff_rate BOOLEAN NOT NULL DEFAULT TRUE,
accounting_rate_management BOOLEAN NOT NULL DEFAULT TRUE,
    accounting_staff_bank_detail BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (admin_id, branch_id)
);

-- Enable Row Level Security for the new table
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- Allow super admins to manage all permissions
CREATE POLICY "Super admins can manage all permissions"
ON public.admin_permissions
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Allow branch admins to view their own permissions
CREATE POLICY "Branch admins can view their own permissions"
ON public.admin_permissions
FOR SELECT
USING (admin_id = auth.uid());
