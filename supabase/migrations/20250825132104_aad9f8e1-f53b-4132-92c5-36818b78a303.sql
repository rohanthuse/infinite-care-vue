-- Add trigger to auto-set organization_id for expenses
CREATE OR REPLACE FUNCTION public.set_expense_organization_id()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- If organization_id is not set, get it from the branch
  IF NEW.organization_id IS NULL THEN
    SELECT b.organization_id INTO NEW.organization_id
    FROM branches b
    WHERE b.id = NEW.branch_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for expenses
CREATE TRIGGER set_expense_organization_id_trigger
  BEFORE INSERT ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_expense_organization_id();

-- Add trigger to auto-set organization_id for travel_records  
CREATE OR REPLACE FUNCTION public.set_travel_organization_id()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- If organization_id is not set, get it from the branch
  IF NEW.organization_id IS NULL THEN
    SELECT b.organization_id INTO NEW.organization_id
    FROM branches b
    WHERE b.id = NEW.branch_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for travel_records
CREATE TRIGGER set_travel_organization_id_trigger
  BEFORE INSERT ON public.travel_records
  FOR EACH ROW
  EXECUTE FUNCTION public.set_travel_organization_id();