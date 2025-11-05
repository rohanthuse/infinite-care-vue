-- Create agreement_signers junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.agreement_signers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agreement_id UUID NOT NULL REFERENCES public.agreements(id) ON DELETE CASCADE,
  signer_type TEXT NOT NULL CHECK (signer_type IN ('client', 'staff', 'other')),
  signer_id UUID NULL, -- References client or staff ID (can be null for 'other')
  signer_name TEXT NOT NULL,
  signer_auth_user_id UUID NULL, -- References auth.users for client/staff
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_agreement_signers_agreement_id ON public.agreement_signers(agreement_id);
CREATE INDEX IF NOT EXISTS idx_agreement_signers_signer_id ON public.agreement_signers(signer_id);
CREATE INDEX IF NOT EXISTS idx_agreement_signers_type ON public.agreement_signers(signer_type);

-- Enable RLS
ALTER TABLE public.agreement_signers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agreement_signers
CREATE POLICY "Users can view agreement signers for their organization"
  ON public.agreement_signers
  FOR SELECT
  USING (
    agreement_id IN (
      SELECT a.id FROM agreements a
      JOIN branches b ON a.branch_id = b.id
      WHERE b.organization_id = get_user_organization_id(auth.uid())
    )
  );

CREATE POLICY "Clients can view their own agreement signers"
  ON public.agreement_signers
  FOR SELECT
  USING (
    signer_type = 'client' AND signer_auth_user_id = auth.uid()
  );

CREATE POLICY "Staff can view their own agreement signers"
  ON public.agreement_signers
  FOR SELECT
  USING (
    signer_type = 'staff' AND signer_auth_user_id = auth.uid()
  );

CREATE POLICY "Organization members can manage agreement signers"
  ON public.agreement_signers
  FOR ALL
  USING (
    agreement_id IN (
      SELECT a.id FROM agreements a
      JOIN branches b ON a.branch_id = b.id
      WHERE b.organization_id = get_user_organization_id(auth.uid())
    )
  )
  WITH CHECK (
    agreement_id IN (
      SELECT a.id FROM agreements a
      JOIN branches b ON a.branch_id = b.id
      WHERE b.organization_id = get_user_organization_id(auth.uid())
    )
  );

-- Migrate existing data from agreements table to agreement_signers
INSERT INTO public.agreement_signers (agreement_id, signer_type, signer_id, signer_name, signer_auth_user_id)
SELECT 
  id as agreement_id,
  signing_party as signer_type,
  CASE 
    WHEN signing_party = 'client' THEN signed_by_client_id
    WHEN signing_party = 'staff' THEN signed_by_staff_id
    ELSE NULL
  END as signer_id,
  signed_by_name as signer_name,
  CASE 
    WHEN signing_party = 'client' THEN signed_by_client_id
    WHEN signing_party = 'staff' THEN signed_by_staff_id
    ELSE NULL
  END as signer_auth_user_id
FROM public.agreements
WHERE signed_by_name IS NOT NULL
ON CONFLICT DO NOTHING;