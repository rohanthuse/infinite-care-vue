-- Create care_plan_forms junction table to link forms to care plans
CREATE TABLE public.care_plan_forms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_plan_id uuid NOT NULL REFERENCES public.client_care_plans(id) ON DELETE CASCADE,
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES auth.users(id),
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  due_date timestamp with time zone,
  status text NOT NULL DEFAULT 'pending',
  completion_notes text,
  completed_at timestamp with time zone,
  completed_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(care_plan_id, form_id)
);

-- Add check constraint for status
ALTER TABLE public.care_plan_forms 
ADD CONSTRAINT check_care_plan_form_status 
CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'cancelled'));

-- Enable RLS
ALTER TABLE public.care_plan_forms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for care_plan_forms
CREATE POLICY "Users can view care plan forms for their branch" 
ON public.care_plan_forms 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.client_care_plans ccp
    JOIN public.clients c ON ccp.client_id = c.id
    LEFT JOIN public.admin_branches ab ON c.branch_id = ab.branch_id
    LEFT JOIN public.staff s ON c.branch_id = s.branch_id
    WHERE ccp.id = care_plan_forms.care_plan_id 
    AND (ab.admin_id = auth.uid() OR s.id = auth.uid() OR c.auth_user_id = auth.uid())
  )
);

CREATE POLICY "Staff can assign forms to care plans" 
ON public.care_plan_forms 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.client_care_plans ccp
    JOIN public.clients c ON ccp.client_id = c.id
    LEFT JOIN public.admin_branches ab ON c.branch_id = ab.branch_id
    LEFT JOIN public.staff s ON c.branch_id = s.branch_id
    WHERE ccp.id = care_plan_forms.care_plan_id 
    AND (ab.admin_id = auth.uid() OR s.id = auth.uid())
  )
);

CREATE POLICY "Users can update care plan form status" 
ON public.care_plan_forms 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.client_care_plans ccp
    JOIN public.clients c ON ccp.client_id = c.id
    LEFT JOIN public.admin_branches ab ON c.branch_id = ab.branch_id
    LEFT JOIN public.staff s ON c.branch_id = s.branch_id
    WHERE ccp.id = care_plan_forms.care_plan_id 
    AND (ab.admin_id = auth.uid() OR s.id = auth.uid() OR c.auth_user_id = auth.uid())
  )
);

CREATE POLICY "Admins can delete care plan forms" 
ON public.care_plan_forms 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.client_care_plans ccp
    JOIN public.clients c ON ccp.client_id = c.id
    JOIN public.admin_branches ab ON c.branch_id = ab.branch_id
    WHERE ccp.id = care_plan_forms.care_plan_id 
    AND ab.admin_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_care_plan_forms_care_plan_id ON public.care_plan_forms(care_plan_id);
CREATE INDEX idx_care_plan_forms_form_id ON public.care_plan_forms(form_id);
CREATE INDEX idx_care_plan_forms_status ON public.care_plan_forms(status);
CREATE INDEX idx_care_plan_forms_due_date ON public.care_plan_forms(due_date) WHERE due_date IS NOT NULL;