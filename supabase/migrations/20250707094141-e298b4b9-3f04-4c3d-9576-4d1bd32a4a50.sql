-- Add client acknowledgment fields to client_care_plans table
ALTER TABLE public.client_care_plans ADD COLUMN IF NOT EXISTS client_acknowledged_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.client_care_plans ADD COLUMN IF NOT EXISTS client_signature_data TEXT;
ALTER TABLE public.client_care_plans ADD COLUMN IF NOT EXISTS client_acknowledgment_ip INET;
ALTER TABLE public.client_care_plans ADD COLUMN IF NOT EXISTS acknowledgment_method TEXT DEFAULT 'digital_signature';
ALTER TABLE public.client_care_plans ADD COLUMN IF NOT EXISTS client_comments TEXT;

-- Create care plan status history table for audit trail
CREATE TABLE IF NOT EXISTS public.care_plan_status_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    care_plan_id UUID NOT NULL REFERENCES public.client_care_plans(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    changed_by_type TEXT NOT NULL, -- 'admin', 'client', 'system'
    reason TEXT,
    client_comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE public.care_plan_status_history ENABLE ROW LEVEL SECURITY;

-- RLS policy for care plan status history
CREATE POLICY "Users can view status history for their branch care plans" 
ON public.care_plan_status_history FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.client_care_plans ccp
        JOIN public.clients c ON ccp.client_id = c.id
        LEFT JOIN public.admin_branches ab ON c.branch_id = ab.branch_id
        LEFT JOIN public.staff s ON c.branch_id = s.branch_id
        WHERE ccp.id = care_plan_status_history.care_plan_id
        AND (ab.admin_id = auth.uid() OR s.id = auth.uid() OR c.auth_user_id = auth.uid())
    )
);

CREATE POLICY "Users can insert status history for their branch care plans" 
ON public.care_plan_status_history FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.client_care_plans ccp
        JOIN public.clients c ON ccp.client_id = c.id
        LEFT JOIN public.admin_branches ab ON c.branch_id = ab.branch_id
        LEFT JOIN public.staff s ON c.branch_id = s.branch_id
        WHERE ccp.id = care_plan_status_history.care_plan_id
        AND (ab.admin_id = auth.uid() OR s.id = auth.uid() OR c.auth_user_id = auth.uid())
    )
);

-- Function to automatically log status changes
CREATE OR REPLACE FUNCTION public.log_care_plan_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.care_plan_status_history (
            care_plan_id,
            previous_status,
            new_status,
            changed_by,
            changed_by_type
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            auth.uid(),
            CASE 
                WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'branch_admin')) THEN 'admin'
                WHEN EXISTS (SELECT 1 FROM public.staff WHERE id = auth.uid()) THEN 'admin'
                ELSE 'client'
            END
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic status logging
DROP TRIGGER IF EXISTS care_plan_status_change_trigger ON public.client_care_plans;
CREATE TRIGGER care_plan_status_change_trigger
    AFTER UPDATE ON public.client_care_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.log_care_plan_status_change();