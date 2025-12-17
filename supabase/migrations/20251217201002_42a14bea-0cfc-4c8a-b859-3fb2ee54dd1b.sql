-- Create table for assigning defined rates to clients
CREATE TABLE public.client_rate_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_rate_id uuid NOT NULL REFERENCES public.service_rates(id) ON DELETE CASCADE,
  authority_id uuid REFERENCES public.authorities(id) ON DELETE SET NULL,
  start_date date NOT NULL,
  end_date date,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_client_rate_assignments_client_id ON public.client_rate_assignments(client_id);
CREATE INDEX idx_client_rate_assignments_service_rate_id ON public.client_rate_assignments(service_rate_id);
CREATE INDEX idx_client_rate_assignments_authority_id ON public.client_rate_assignments(authority_id);

-- Enable RLS
ALTER TABLE public.client_rate_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view client rate assignments in their organization"
ON public.client_rate_assignments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM clients c
    JOIN branches b ON c.branch_id = b.id
    WHERE c.id = client_rate_assignments.client_id
    AND b.organization_id = get_user_organization_id(auth.uid())
  )
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'branch_admin'::app_role)
);

CREATE POLICY "Users can insert client rate assignments in their organization"
ON public.client_rate_assignments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM clients c
    JOIN branches b ON c.branch_id = b.id
    WHERE c.id = client_rate_assignments.client_id
    AND b.organization_id = get_user_organization_id(auth.uid())
  )
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'branch_admin'::app_role)
);

CREATE POLICY "Users can update client rate assignments in their organization"
ON public.client_rate_assignments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM clients c
    JOIN branches b ON c.branch_id = b.id
    WHERE c.id = client_rate_assignments.client_id
    AND b.organization_id = get_user_organization_id(auth.uid())
  )
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'branch_admin'::app_role)
);

CREATE POLICY "Users can delete client rate assignments in their organization"
ON public.client_rate_assignments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM clients c
    JOIN branches b ON c.branch_id = b.id
    WHERE c.id = client_rate_assignments.client_id
    AND b.organization_id = get_user_organization_id(auth.uid())
  )
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'branch_admin'::app_role)
);

-- Create trigger for updated_at
CREATE TRIGGER update_client_rate_assignments_updated_at
  BEFORE UPDATE ON public.client_rate_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();