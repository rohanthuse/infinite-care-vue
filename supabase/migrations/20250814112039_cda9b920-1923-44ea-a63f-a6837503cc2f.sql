-- Add app_admin role to the existing app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'app_admin';

-- Create app_admin_organizations table for app admin access to manage organizations
CREATE TABLE IF NOT EXISTS public.app_admin_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_admin_id uuid NOT NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(app_admin_id, organization_id)
);

-- Enable RLS on the new table
ALTER TABLE public.app_admin_organizations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for app admins to manage organizations
CREATE POLICY "App admins can manage their assigned organizations"
  ON public.app_admin_organizations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'app_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'app_admin'
    )
  );

-- Update organizations table RLS to allow app admins to manage all organizations
CREATE POLICY "App admins can manage all organizations"
  ON public.organizations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'app_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'app_admin'
    )
  );

-- Function to check if user is app admin
CREATE OR REPLACE FUNCTION public.is_app_admin(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_id_param AND role = 'app_admin'
  );
END;
$$;