-- Fix RLS policies for fluid_balance_targets table to allow staff access
-- Drop old restrictive policies
DROP POLICY IF EXISTS "Staff can view fluid balance targets for their branch clients" ON public.fluid_balance_targets;
DROP POLICY IF EXISTS "Staff can insert fluid balance targets for their branch clients" ON public.fluid_balance_targets;
DROP POLICY IF EXISTS "Staff can update fluid balance targets for their branch clients" ON public.fluid_balance_targets;
DROP POLICY IF EXISTS "Staff can delete fluid balance targets for their branch clients" ON public.fluid_balance_targets;

-- Create new comprehensive policies using the security definer function
CREATE POLICY "Staff can view fluid balance targets"
ON public.fluid_balance_targets
FOR SELECT
USING (
  public.can_access_client_data(auth.uid(), client_id)
);

CREATE POLICY "Staff can insert fluid balance targets"
ON public.fluid_balance_targets
FOR INSERT
WITH CHECK (
  public.can_access_client_data(auth.uid(), client_id)
);

CREATE POLICY "Staff can update fluid balance targets"
ON public.fluid_balance_targets
FOR UPDATE
USING (
  public.can_access_client_data(auth.uid(), client_id)
);

CREATE POLICY "Staff can delete fluid balance targets"
ON public.fluid_balance_targets
FOR DELETE
USING (
  public.can_access_client_data(auth.uid(), client_id)
);