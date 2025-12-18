-- Create junction table for care plan staff assignments
CREATE TABLE public.care_plan_staff_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_plan_id UUID NOT NULL REFERENCES client_care_plans(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(care_plan_id, staff_id)
);

-- Create indexes for performance
CREATE INDEX idx_care_plan_staff_care_plan_id ON care_plan_staff_assignments(care_plan_id);
CREATE INDEX idx_care_plan_staff_staff_id ON care_plan_staff_assignments(staff_id);

-- Enable RLS
ALTER TABLE care_plan_staff_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Staff can view assignments for care plans they are assigned to
CREATE POLICY "Staff can view their own assignments"
ON care_plan_staff_assignments FOR SELECT
USING (
  staff_id IN (
    SELECT id FROM staff WHERE auth_user_id = auth.uid()
  )
);

-- Branch admins can view all assignments in their branches
CREATE POLICY "Branch admins can view branch assignments"
ON care_plan_staff_assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_branches ab
    JOIN client_care_plans ccp ON ccp.id = care_plan_id
    JOIN clients c ON c.id = ccp.client_id
    WHERE ab.admin_id = auth.uid() AND ab.branch_id = c.branch_id
  )
);

-- Branch admins can manage assignments in their branches
CREATE POLICY "Branch admins can insert assignments"
ON care_plan_staff_assignments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_branches ab
    JOIN client_care_plans ccp ON ccp.id = care_plan_id
    JOIN clients c ON c.id = ccp.client_id
    WHERE ab.admin_id = auth.uid() AND ab.branch_id = c.branch_id
  )
);

CREATE POLICY "Branch admins can update assignments"
ON care_plan_staff_assignments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM admin_branches ab
    JOIN client_care_plans ccp ON ccp.id = care_plan_id
    JOIN clients c ON c.id = ccp.client_id
    WHERE ab.admin_id = auth.uid() AND ab.branch_id = c.branch_id
  )
);

CREATE POLICY "Branch admins can delete assignments"
ON care_plan_staff_assignments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM admin_branches ab
    JOIN client_care_plans ccp ON ccp.id = care_plan_id
    JOIN clients c ON c.id = ccp.client_id
    WHERE ab.admin_id = auth.uid() AND ab.branch_id = c.branch_id
  )
);