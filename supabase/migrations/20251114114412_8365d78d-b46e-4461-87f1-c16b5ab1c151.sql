-- Create security definer function to check if user can access client data
CREATE OR REPLACE FUNCTION public.can_access_client_data(_user_id uuid, _client_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is super admin
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'super_admin'::app_role
  ) THEN
    RETURN true;
  END IF;
  
  -- Check if user is branch admin for the client's branch
  IF EXISTS (
    SELECT 1
    FROM public.clients c
    JOIN public.admin_branches ab ON (ab.branch_id = c.branch_id)
    WHERE c.id = _client_id AND ab.admin_id = _user_id
  ) THEN
    RETURN true;
  END IF;
  
  -- Check if user is staff in the same branch as the client
  IF EXISTS (
    SELECT 1
    FROM public.clients c
    JOIN public.staff s ON (s.branch_id = c.branch_id)
    WHERE c.id = _client_id AND s.auth_user_id = _user_id
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Update RLS policies for fluid_intake_records
DROP POLICY IF EXISTS "Admins and staff can insert fluid intake records" ON public.fluid_intake_records;

CREATE POLICY "Admins and staff can insert fluid intake records"
ON public.fluid_intake_records
FOR INSERT
WITH CHECK (
  public.can_access_client_data(auth.uid(), client_id)
);

-- Update SELECT policy for consistency
DROP POLICY IF EXISTS "Staff can view fluid intake records for their branch clients" ON public.fluid_intake_records;

CREATE POLICY "Staff can view fluid intake records"
ON public.fluid_intake_records
FOR SELECT
USING (
  public.can_access_client_data(auth.uid(), client_id)
);

-- Update UPDATE policy for consistency
DROP POLICY IF EXISTS "Staff can update fluid intake records for their branch clients" ON public.fluid_intake_records;

CREATE POLICY "Staff can update fluid intake records"
ON public.fluid_intake_records
FOR UPDATE
USING (
  public.can_access_client_data(auth.uid(), client_id)
);

-- Update DELETE policy for consistency
DROP POLICY IF EXISTS "Staff can delete fluid intake records for their branch clients" ON public.fluid_intake_records;

CREATE POLICY "Staff can delete fluid intake records"
ON public.fluid_intake_records
FOR DELETE
USING (
  public.can_access_client_data(auth.uid(), client_id)
);

-- Update RLS policies for fluid_output_records
DROP POLICY IF EXISTS "Admins and staff can insert fluid output records" ON public.fluid_output_records;

CREATE POLICY "Admins and staff can insert fluid output records"
ON public.fluid_output_records
FOR INSERT
WITH CHECK (
  public.can_access_client_data(auth.uid(), client_id)
);

-- Update SELECT policy for consistency
DROP POLICY IF EXISTS "Staff can view fluid output records for their branch clients" ON public.fluid_output_records;

CREATE POLICY "Staff can view fluid output records"
ON public.fluid_output_records
FOR SELECT
USING (
  public.can_access_client_data(auth.uid(), client_id)
);

-- Update UPDATE policy for consistency
DROP POLICY IF EXISTS "Staff can update fluid output records for their branch clients" ON public.fluid_output_records;

CREATE POLICY "Staff can update fluid output records"
ON public.fluid_output_records
FOR UPDATE
USING (
  public.can_access_client_data(auth.uid(), client_id)
);

-- Update DELETE policy for consistency
DROP POLICY IF EXISTS "Staff can delete fluid output records for their branch clients" ON public.fluid_output_records;

CREATE POLICY "Staff can delete fluid output records"
ON public.fluid_output_records
FOR DELETE
USING (
  public.can_access_client_data(auth.uid(), client_id)
);