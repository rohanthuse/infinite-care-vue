
-- 1) Trigger function to ensure expenses.organization_id is set correctly
CREATE OR REPLACE FUNCTION public.set_expense_organization_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If organization_id not provided, try to infer it from the branch
  IF NEW.organization_id IS NULL THEN
    SELECT b.organization_id
      INTO NEW.organization_id
    FROM public.branches b
    WHERE b.id = NEW.branch_id;

    -- Fallback to the current user's organization if branch lookup didn't populate it
    IF NEW.organization_id IS NULL THEN
      NEW.organization_id := public.get_user_organization_id(auth.uid());
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 2) Create/replace BEFORE INSERT trigger
DROP TRIGGER IF EXISTS trg_set_expense_org_id ON public.expenses;
CREATE TRIGGER trg_set_expense_org_id
BEFORE INSERT ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.set_expense_organization_id();

-- 3) Create/replace BEFORE UPDATE trigger (only when branch changes or organization_id is missing)
DROP TRIGGER IF EXISTS trg_update_expense_org_id ON public.expenses;
CREATE TRIGGER trg_update_expense_org_id
BEFORE UPDATE ON public.expenses
FOR EACH ROW
WHEN (OLD.branch_id IS DISTINCT FROM NEW.branch_id OR NEW.organization_id IS NULL)
EXECUTE FUNCTION public.set_expense_organization_id();

-- 4) Backfill existing rows where organization_id is NULL
UPDATE public.expenses e
SET organization_id = b.organization_id
FROM public.branches b
WHERE e.organization_id IS NULL
  AND e.branch_id = b.id;
