
-- Create forms table to store form definitions
CREATE TABLE public.forms (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    branch_id uuid NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    published boolean NOT NULL DEFAULT false,
    requires_review boolean NOT NULL DEFAULT false,
    version integer NOT NULL DEFAULT 1,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    settings jsonb DEFAULT '{
        "showProgressBar": false,
        "allowSaveAsDraft": false,
        "autoSaveEnabled": false,
        "autoSaveInterval": 60,
        "redirectAfterSubmit": false,
        "submitButtonText": "Submit"
    }'::jsonb
);

-- Create form_elements table to store form field configurations
CREATE TABLE public.form_elements (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
    element_type text NOT NULL CHECK (element_type IN (
        'text', 'textarea', 'number', 'email', 'tel', 'date', 'time',
        'checkbox', 'radio', 'select', 'multiselect', 'signature', 'file',
        'heading', 'paragraph', 'section', 'divider'
    )),
    label text NOT NULL,
    required boolean NOT NULL DEFAULT false,
    order_index integer NOT NULL,
    properties jsonb DEFAULT '{}'::jsonb,
    validation_rules jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create form_assignees table to manage form assignments
CREATE TABLE public.form_assignees (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
    assignee_type text NOT NULL CHECK (assignee_type IN ('client', 'staff', 'branch', 'carer')),
    assignee_id uuid NOT NULL,
    assignee_name text NOT NULL,
    assigned_at timestamp with time zone NOT NULL DEFAULT now(),
    assigned_by uuid NOT NULL
);

-- Create form_submissions table to store submitted form data
CREATE TABLE public.form_submissions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
    branch_id uuid NOT NULL,
    submitted_by uuid NOT NULL,
    submitted_by_type text NOT NULL CHECK (submitted_by_type IN ('client', 'staff', 'carer')),
    submission_data jsonb NOT NULL DEFAULT '{}'::jsonb,
    status text NOT NULL DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'under_review', 'approved', 'rejected')),
    submitted_at timestamp with time zone NOT NULL DEFAULT now(),
    reviewed_at timestamp with time zone,
    reviewed_by uuid,
    review_notes text
);

-- Create form_permissions table for access control
CREATE TABLE public.form_permissions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
    permission_type text NOT NULL CHECK (permission_type IN ('view', 'edit', 'submit', 'manage')),
    role_type text NOT NULL CHECK (role_type IN ('admin', 'branch-manager', 'staff', 'carer', 'client')),
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add triggers for updated_at timestamps
CREATE TRIGGER handle_updated_at_forms BEFORE UPDATE ON public.forms
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER handle_updated_at_form_elements BEFORE UPDATE ON public.form_elements
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forms
CREATE POLICY "Super admins can manage all forms"
ON public.forms FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Branch admins can manage their branch forms"
ON public.forms FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.admin_branches ab 
        WHERE ab.branch_id = forms.branch_id 
        AND ab.admin_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.admin_branches ab 
        WHERE ab.branch_id = forms.branch_id 
        AND ab.admin_id = auth.uid()
    )
);

-- RLS Policies for form_elements
CREATE POLICY "Users can access form elements for their branch forms"
ON public.form_elements FOR ALL
USING (
    public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
        SELECT 1 FROM public.forms f
        JOIN public.admin_branches ab ON f.branch_id = ab.branch_id
        WHERE f.id = form_elements.form_id 
        AND ab.admin_id = auth.uid()
    )
)
WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
        SELECT 1 FROM public.forms f
        JOIN public.admin_branches ab ON f.branch_id = ab.branch_id
        WHERE f.id = form_elements.form_id 
        AND ab.admin_id = auth.uid()
    )
);

-- RLS Policies for form_assignees
CREATE POLICY "Users can manage assignees for their branch forms"
ON public.form_assignees FOR ALL
USING (
    public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
        SELECT 1 FROM public.forms f
        JOIN public.admin_branches ab ON f.branch_id = ab.branch_id
        WHERE f.id = form_assignees.form_id 
        AND ab.admin_id = auth.uid()
    )
)
WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
        SELECT 1 FROM public.forms f
        JOIN public.admin_branches ab ON f.branch_id = ab.branch_id
        WHERE f.id = form_assignees.form_id 
        AND ab.admin_id = auth.uid()
    )
);

-- RLS Policies for form_submissions
CREATE POLICY "Users can manage submissions for their branch forms"
ON public.form_submissions FOR ALL
USING (
    public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
        SELECT 1 FROM public.admin_branches ab 
        WHERE ab.branch_id = form_submissions.branch_id 
        AND ab.admin_id = auth.uid()
    )
    OR submitted_by = auth.uid()
)
WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
        SELECT 1 FROM public.admin_branches ab 
        WHERE ab.branch_id = form_submissions.branch_id 
        AND ab.admin_id = auth.uid()
    )
    OR submitted_by = auth.uid()
);

-- RLS Policies for form_permissions
CREATE POLICY "Users can manage permissions for their branch forms"
ON public.form_permissions FOR ALL
USING (
    public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
        SELECT 1 FROM public.forms f
        JOIN public.admin_branches ab ON f.branch_id = ab.branch_id
        WHERE f.id = form_permissions.form_id 
        AND ab.admin_id = auth.uid()
    )
)
WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
        SELECT 1 FROM public.forms f
        JOIN public.admin_branches ab ON f.branch_id = ab.branch_id
        WHERE f.id = form_permissions.form_id 
        AND ab.admin_id = auth.uid()
    )
);
