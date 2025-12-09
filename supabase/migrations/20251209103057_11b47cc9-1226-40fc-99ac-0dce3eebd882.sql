-- Add organization_id to client_appointments if not exists
ALTER TABLE public.client_appointments 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- Backfill organization_id from branches
UPDATE public.client_appointments ca
SET organization_id = b.organization_id
FROM public.branches b
WHERE ca.branch_id = b.id
AND ca.organization_id IS NULL;

-- Create trigger to auto-populate organization_id
CREATE OR REPLACE FUNCTION public.set_meeting_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.branch_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.branches
    WHERE id = NEW.branch_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_set_meeting_org_id ON public.client_appointments;
CREATE TRIGGER tr_set_meeting_org_id
BEFORE INSERT OR UPDATE ON public.client_appointments
FOR EACH ROW EXECUTE FUNCTION public.set_meeting_organization_id();