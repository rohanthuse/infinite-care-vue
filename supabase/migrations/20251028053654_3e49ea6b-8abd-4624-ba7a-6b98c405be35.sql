-- Create task_assignees junction table for multiple assignees per task
CREATE TABLE IF NOT EXISTS task_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(task_id, staff_id)
);

-- Create indexes for performance
CREATE INDEX idx_task_assignees_task_id ON task_assignees(task_id);
CREATE INDEX idx_task_assignees_staff_id ON task_assignees(staff_id);

-- Enable RLS
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow authenticated users to view task assignees from their organization
CREATE POLICY "Users can view task assignees from their organization"
ON task_assignees FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_assignees.task_id
    AND (
      tasks.branch_id IN (
        SELECT branch_id FROM staff WHERE auth_user_id = auth.uid()
      )
      OR
      tasks.branch_id IN (
        SELECT branch_id FROM clients WHERE auth_user_id = auth.uid()
      )
    )
  )
);

-- RLS Policy: Allow staff to insert task assignees
CREATE POLICY "Staff can insert task assignees"
ON task_assignees FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staff
    WHERE staff.auth_user_id = auth.uid()
  )
);

-- RLS Policy: Allow staff to update task assignees
CREATE POLICY "Staff can update task assignees"
ON task_assignees FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM staff
    WHERE staff.auth_user_id = auth.uid()
  )
);

-- RLS Policy: Allow staff to delete task assignees
CREATE POLICY "Staff can delete task assignees"
ON task_assignees FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM staff
    WHERE staff.auth_user_id = auth.uid()
  )
);

-- Migrate existing tasks with single assignee to the junction table
INSERT INTO task_assignees (task_id, staff_id, is_primary)
SELECT id, assignee_id, true
FROM tasks
WHERE assignee_id IS NOT NULL
ON CONFLICT (task_id, staff_id) DO NOTHING;