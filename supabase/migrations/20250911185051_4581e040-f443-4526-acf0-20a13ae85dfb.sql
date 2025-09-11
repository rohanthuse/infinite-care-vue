-- Create client_status_history table for tracking suspension and status changes
CREATE TABLE public.client_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('suspend', 'resume', 'status_change')),
  from_status TEXT,
  to_status TEXT,
  suspension_type TEXT CHECK (suspension_type IN ('temporary', 'indefinite')),
  reason TEXT,
  details TEXT,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_until TIMESTAMPTZ,
  apply_to JSONB NOT NULL DEFAULT '{}'::jsonb,
  notify JSONB NOT NULL DEFAULT '{}'::jsonb,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_status_history ENABLE ROW LEVEL SECURITY;

-- Create policies for client_status_history
CREATE POLICY "Organization members can view client status history"
  ON public.client_status_history
  FOR SELECT
  USING (
    client_id IN (
      SELECT c.id 
      FROM clients c
      JOIN branches b ON c.branch_id = b.id
      WHERE b.organization_id = get_user_organization_id(auth.uid())
    )
  );

CREATE POLICY "Organization members can insert client status history"
  ON public.client_status_history
  FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT c.id 
      FROM clients c
      JOIN branches b ON c.branch_id = b.id
      WHERE b.organization_id = get_user_organization_id(auth.uid())
    )
  );

CREATE POLICY "Organization members can update client status history"
  ON public.client_status_history
  FOR UPDATE
  USING (
    client_id IN (
      SELECT c.id 
      FROM clients c
      JOIN branches b ON c.branch_id = b.id
      WHERE b.organization_id = get_user_organization_id(auth.uid())
    )
  );

-- Create index for better performance
CREATE INDEX idx_client_status_history_client_id ON public.client_status_history(client_id);
CREATE INDEX idx_client_status_history_effective_from ON public.client_status_history(effective_from);

-- Create function to get current suspension status
CREATE OR REPLACE FUNCTION public.get_client_suspension_status(client_id_param uuid)
RETURNS TABLE(
  is_suspended boolean,
  suspension_id uuid,
  suspension_type text,
  effective_from timestamptz,
  effective_until timestamptz,
  reason text,
  apply_to jsonb
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS (
      SELECT 1 FROM public.client_status_history csh
      WHERE csh.client_id = client_id_param 
      AND csh.action = 'suspend'
      AND csh.effective_from <= now()
      AND (csh.effective_until IS NULL OR csh.effective_until > now())
      AND NOT EXISTS (
        SELECT 1 FROM public.client_status_history csh2
        WHERE csh2.client_id = client_id_param
        AND csh2.action = 'resume'
        AND csh2.effective_from > csh.effective_from
      )
    ) as is_suspended,
    csh.id as suspension_id,
    csh.suspension_type,
    csh.effective_from,
    csh.effective_until,
    csh.reason,
    csh.apply_to
  FROM public.client_status_history csh
  WHERE csh.client_id = client_id_param 
  AND csh.action = 'suspend'
  AND csh.effective_from <= now()
  AND (csh.effective_until IS NULL OR csh.effective_until > now())
  AND NOT EXISTS (
    SELECT 1 FROM public.client_status_history csh2
    WHERE csh2.client_id = client_id_param
    AND csh2.action = 'resume'
    AND csh2.effective_from > csh.effective_from
  )
  ORDER BY csh.effective_from DESC
  LIMIT 1;
END;
$$;