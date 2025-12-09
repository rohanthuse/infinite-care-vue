-- Create staff_branch_transfers table to track transfer history
CREATE TABLE public.staff_branch_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  from_branch_id UUID REFERENCES public.branches(id),
  to_branch_id UUID NOT NULL REFERENCES public.branches(id),
  effective_date DATE NOT NULL,
  transfer_reason TEXT,
  move_future_bookings BOOLEAN DEFAULT true,
  future_bookings_moved INTEGER DEFAULT 0,
  transferred_by UUID,
  transfer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.staff_branch_transfers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Super admins can manage all transfers"
ON public.staff_branch_transfers
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Branch admins can view transfers for their branches"
ON public.staff_branch_transfers
FOR SELECT
USING (
  from_branch_id IN (SELECT branch_id FROM admin_branches WHERE admin_id = auth.uid())
  OR to_branch_id IN (SELECT branch_id FROM admin_branches WHERE admin_id = auth.uid())
);

CREATE POLICY "Branch admins can create transfers from their branches"
ON public.staff_branch_transfers
FOR INSERT
WITH CHECK (
  from_branch_id IN (SELECT branch_id FROM admin_branches WHERE admin_id = auth.uid())
);

-- Add index for faster lookups
CREATE INDEX idx_staff_branch_transfers_staff_id ON public.staff_branch_transfers(staff_id);
CREATE INDEX idx_staff_branch_transfers_from_branch ON public.staff_branch_transfers(from_branch_id);
CREATE INDEX idx_staff_branch_transfers_to_branch ON public.staff_branch_transfers(to_branch_id);