-- Create missing branch for Shashank Care Services with only required fields
INSERT INTO public.branches (id, name, organization_id, address, phone, email, status, country, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Main Branch',
  '9ad7f8d6-32ba-4beb-b62c-5f3c35c8a2ed',
  '123 Main Street, Mumbai',
  '+91-9876543210',
  'main@shashankcare.com',
  'Active',
  'India',
  now(),
  now()
);

-- Create a function to update last login for all user types
CREATE OR REPLACE FUNCTION public.update_user_last_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update system_users if they exist
  UPDATE public.system_users 
  SET last_login_at = now()
  WHERE id = NEW.id;
  
  -- Update staff if they exist
  UPDATE public.staff 
  SET last_login_at = now()
  WHERE auth_user_id = NEW.id;
  
  -- Update clients if they exist  
  UPDATE public.clients 
  SET last_login_at = now()
  WHERE auth_user_id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to update last login on auth events
CREATE OR REPLACE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION public.update_user_last_login();

-- Add last_login_at columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'last_login_at') THEN
    ALTER TABLE public.staff ADD COLUMN last_login_at timestamp with time zone;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'last_login_at') THEN
    ALTER TABLE public.clients ADD COLUMN last_login_at timestamp with time zone;
  END IF;
END $$;