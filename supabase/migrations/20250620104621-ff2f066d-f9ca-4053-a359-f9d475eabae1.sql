
-- Only assign roles to staff members who have corresponding entries in auth.users
-- First, let's see which staff members have valid user accounts
INSERT INTO public.user_roles (user_id, role)
SELECT s.id, 'carer'::app_role
FROM public.staff s
LEFT JOIN public.user_roles ur ON s.id = ur.user_id
WHERE ur.user_id IS NULL
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = s.id);

-- Create the function to ensure future staff get roles
CREATE OR REPLACE FUNCTION ensure_staff_has_role()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new staff member is added, automatically assign 'carer' role if no role exists
  -- and the user exists in auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.id) 
     AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'carer');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically assign roles to new staff
DROP TRIGGER IF EXISTS ensure_staff_role_trigger ON public.staff;
CREATE TRIGGER ensure_staff_role_trigger
  AFTER INSERT ON public.staff
  FOR EACH ROW
  EXECUTE FUNCTION ensure_staff_has_role();
