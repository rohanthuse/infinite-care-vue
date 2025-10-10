-- ============================================================================
-- Fix Invoice Deletion: Ensure CASCADE deletes work properly
-- ============================================================================

-- Drop existing restrictive policies on related tables if they exist
DROP POLICY IF EXISTS "Only organization members can delete line items" ON public.invoice_line_items;
DROP POLICY IF EXISTS "Only organization members can delete payments" ON public.payment_records;
DROP POLICY IF EXISTS "Only organization members can delete periods" ON public.invoice_periods;

-- Create permissive DELETE policies for invoice-related tables
-- These allow deletion when the parent invoice can be deleted

-- Invoice Line Items: Allow delete when parent invoice is deletable
CREATE POLICY "Allow delete of line items when invoice is deletable"
ON public.invoice_line_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.client_billing cb
    WHERE cb.id = invoice_line_items.invoice_id
    AND (
      -- User can delete if they can access the invoice via organization
      cb.organization_id = get_user_organization_id(auth.uid())
      OR
      -- OR if they're an admin of the branch
      EXISTS (
        SELECT 1 FROM public.admin_branches ab
        JOIN public.clients c ON c.branch_id = ab.branch_id
        WHERE ab.admin_id = auth.uid() 
        AND c.id = cb.client_id
      )
      OR
      -- OR if they're a super_admin
      has_role(auth.uid(), 'super_admin'::app_role)
    )
  )
);

-- Payment Records: Allow delete when parent invoice is deletable
CREATE POLICY "Allow delete of payments when invoice is deletable"
ON public.payment_records
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.client_billing cb
    WHERE cb.id = payment_records.invoice_id
    AND (
      cb.organization_id = get_user_organization_id(auth.uid())
      OR
      EXISTS (
        SELECT 1 FROM public.admin_branches ab
        JOIN public.clients c ON c.branch_id = ab.branch_id
        WHERE ab.admin_id = auth.uid() 
        AND c.id = cb.client_id
      )
      OR
      has_role(auth.uid(), 'super_admin'::app_role)
    )
  )
);

-- Invoice Periods: Allow delete when parent invoice is deletable
CREATE POLICY "Allow delete of periods when invoice is deletable"
ON public.invoice_periods
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.client_billing cb
    WHERE cb.id = invoice_periods.invoice_id
    AND (
      cb.organization_id = get_user_organization_id(auth.uid())
      OR
      EXISTS (
        SELECT 1 FROM public.admin_branches ab
        JOIN public.clients c ON c.branch_id = ab.branch_id
        WHERE ab.admin_id = auth.uid() 
        AND c.id = cb.client_id
      )
      OR
      has_role(auth.uid(), 'super_admin'::app_role)
    )
  )
);

-- Add helpful comments
COMMENT ON POLICY "Allow delete of line items when invoice is deletable" ON public.invoice_line_items IS
'Allows CASCADE delete of line items when parent invoice is deleted by authorized users';

COMMENT ON POLICY "Allow delete of payments when invoice is deletable" ON public.payment_records IS
'Allows CASCADE delete of payments when parent invoice is deleted by authorized users';

COMMENT ON POLICY "Allow delete of periods when invoice is deletable" ON public.invoice_periods IS
'Allows CASCADE delete of periods when parent invoice is deleted by authorized users';