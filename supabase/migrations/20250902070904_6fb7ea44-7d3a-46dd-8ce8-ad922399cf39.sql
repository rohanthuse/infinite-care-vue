
-- 1) Ensure RLS is enabled (safe to run repeatedly)
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- 2) Policy: allow organization members to INSERT services for their own org
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'services' 
      AND policyname = 'Org members can insert services'
  ) THEN
    CREATE POLICY "Org members can insert services"
      ON public.services
      FOR INSERT
      WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));
  END IF;
END$$;

-- 3) Policy: allow organization members to UPDATE services in their org
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'services' 
      AND policyname = 'Org members can update services'
  ) THEN
    CREATE POLICY "Org members can update services"
      ON public.services
      FOR UPDATE
      USING (organization_id = public.get_user_organization_id(auth.uid()))
      WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));
  END IF;
END$$;

-- 4) Policy: allow organization members to DELETE services in their org
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'services' 
      AND policyname = 'Org members can delete services'
  ) THEN
    CREATE POLICY "Org members can delete services"
      ON public.services
      FOR DELETE
      USING (organization_id = public.get_user_organization_id(auth.uid()));
  END IF;
END$$;

-- 5) Defensive default: auto-set organization_id before insert if missing
CREATE OR REPLACE FUNCTION public.set_service_organization_id()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := public.get_user_organization_id(auth.uid());
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS set_service_org_id_before_insert ON public.services;
CREATE TRIGGER set_service_org_id_before_insert
BEFORE INSERT ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.set_service_organization_id();
