-- Optimize RLS policies for visit workflow to eliminate slow EXISTS subqueries
-- Replace complex nested queries with direct indexed lookups

-- Drop existing slow policies
DROP POLICY IF EXISTS "Carers can view their own visit records" ON visit_records;
DROP POLICY IF EXISTS "Carers can update their own visit records" ON visit_records;
DROP POLICY IF EXISTS "Carers can insert their own visit records" ON visit_records;

-- Create optimized policies using direct staff_id lookup (indexed column)
CREATE POLICY "Carers can view their own visit records" 
ON visit_records 
FOR SELECT 
USING (
  staff_id IN (
    SELECT id FROM staff WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Carers can update their own visit records" 
ON visit_records 
FOR UPDATE 
USING (
  staff_id IN (
    SELECT id FROM staff WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Carers can insert their own visit records" 
ON visit_records 
FOR INSERT 
WITH CHECK (
  staff_id IN (
    SELECT id FROM staff WHERE auth_user_id = auth.uid()
  )
);

-- Optimize visit_tasks policies
DROP POLICY IF EXISTS "Carers can view tasks for their visits" ON visit_tasks;
DROP POLICY IF EXISTS "Carers can update tasks for their visits" ON visit_tasks;

CREATE POLICY "Carers can view tasks for their visits" 
ON visit_tasks 
FOR SELECT 
USING (
  visit_record_id IN (
    SELECT id FROM visit_records 
    WHERE staff_id IN (
      SELECT id FROM staff WHERE auth_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Carers can update tasks for their visits" 
ON visit_tasks 
FOR UPDATE 
USING (
  visit_record_id IN (
    SELECT id FROM visit_records 
    WHERE staff_id IN (
      SELECT id FROM staff WHERE auth_user_id = auth.uid()
    )
  )
);

-- Optimize visit_medications policies
DROP POLICY IF EXISTS "Carers can view medications for their visits" ON visit_medications;
DROP POLICY IF EXISTS "Carers can update medications for their visits" ON visit_medications;

CREATE POLICY "Carers can view medications for their visits" 
ON visit_medications 
FOR SELECT 
USING (
  visit_record_id IN (
    SELECT id FROM visit_records 
    WHERE staff_id IN (
      SELECT id FROM staff WHERE auth_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Carers can update medications for their visits" 
ON visit_medications 
FOR UPDATE 
USING (
  visit_record_id IN (
    SELECT id FROM visit_records 
    WHERE staff_id IN (
      SELECT id FROM staff WHERE auth_user_id = auth.uid()
    )
  )
);

-- Optimize visit_vitals policies
DROP POLICY IF EXISTS "Carers can view vitals for their visits" ON visit_vitals;
DROP POLICY IF EXISTS "Carers can insert vitals for their visits" ON visit_vitals;

CREATE POLICY "Carers can view vitals for their visits" 
ON visit_vitals 
FOR SELECT 
USING (
  visit_record_id IN (
    SELECT id FROM visit_records 
    WHERE staff_id IN (
      SELECT id FROM staff WHERE auth_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Carers can insert vitals for their visits" 
ON visit_vitals 
FOR INSERT 
WITH CHECK (
  visit_record_id IN (
    SELECT id FROM visit_records 
    WHERE staff_id IN (
      SELECT id FROM staff WHERE auth_user_id = auth.uid()
    )
  )
);

-- Optimize visit_events policies
DROP POLICY IF EXISTS "Carers can view events for their visits" ON visit_events;
DROP POLICY IF EXISTS "Carers can insert events for their visits" ON visit_events;

CREATE POLICY "Carers can view events for their visits" 
ON visit_events 
FOR SELECT 
USING (
  visit_record_id IN (
    SELECT id FROM visit_records 
    WHERE staff_id IN (
      SELECT id FROM staff WHERE auth_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Carers can insert events for their visits" 
ON visit_events 
FOR INSERT 
WITH CHECK (
  visit_record_id IN (
    SELECT id FROM visit_records 
    WHERE staff_id IN (
      SELECT id FROM staff WHERE auth_user_id = auth.uid()
    )
  )
);