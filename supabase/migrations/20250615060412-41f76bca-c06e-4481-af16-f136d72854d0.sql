
-- 1. Create a table for business branches
CREATE TABLE public.branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create an enum type for user roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'branch_admin');

-- 3. Create a table for user roles
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- 4. Create a table for user profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  status TEXT DEFAULT 'pending' NOT NULL, -- Values: pending, active, inactive
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create a junction table to link admins to branches
CREATE TABLE public.admin_branches (
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  PRIMARY KEY (admin_id, branch_id)
);

-- 6. Create a function to check a user's role (will be used in RLS policies)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- 7. Create a trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Create a new profile
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  );

  -- Assign a role if it's provided during sign-up (e.g., via invitation)
  IF new.raw_user_meta_data ->> 'role' IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (new.id, (new.raw_user_meta_data ->> 'role')::app_role);
  END IF;

  RETURN new;
END;
$$;

-- Attach the trigger to the users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. Enable Row Level Security (RLS) on all new tables
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_branches ENABLE ROW LEVEL SECURITY;

-- 9. Define RLS policies for data access

-- Branches Table Policies
CREATE POLICY "Allow authenticated users to see all branches" ON public.branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow super_admins to manage branches" ON public.branches FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- User Roles Table Policies
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Super admins can manage user roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Profiles Table Policies
CREATE POLICY "Users can view and update their own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'branch_admin'));
CREATE POLICY "Super Admins can manage all profiles" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Admin Branches Table Policies
CREATE POLICY "Admins can see admin-branch relations" ON public.admin_branches FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'branch_admin'));
CREATE POLICY "Super Admins can manage admin-branch relations" ON public.admin_branches FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 10. Seed initial data to match your current UI
INSERT INTO public.branches (name) VALUES ('Med-Infinite - Milton Keynes');
