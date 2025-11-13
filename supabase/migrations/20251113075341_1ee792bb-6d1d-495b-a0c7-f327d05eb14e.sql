-- Clean up duplicate visit_records RLS policies to fix timeout errors
-- Drop ALL existing carer/staff policies that may be causing conflicts

DROP POLICY IF EXISTS "Carers can select their own visit records" ON visit_records;
DROP POLICY IF EXISTS "Carers can view their own visit records" ON visit_records;
DROP POLICY IF EXISTS "Carers can update their own visit records" ON visit_records;
DROP POLICY IF EXISTS "Carers can insert their own visit records" ON visit_records;
DROP POLICY IF EXISTS "Staff can view visit records for their bookings" ON visit_records;
DROP POLICY IF EXISTS "Staff can update visit records for their bookings" ON visit_records;
DROP POLICY IF EXISTS "Staff can insert visit records for their bookings" ON visit_records;

-- Create single set of optimized policies using only direct indexed lookups
-- These use staff_id which is indexed for fast lookups

CREATE POLICY "carer_select_own_visits" 
ON visit_records 
FOR SELECT 
USING (
  staff_id IN (SELECT id FROM staff WHERE auth_user_id = auth.uid())
);

CREATE POLICY "carer_update_own_visits" 
ON visit_records 
FOR UPDATE 
USING (
  staff_id IN (SELECT id FROM staff WHERE auth_user_id = auth.uid())
);

CREATE POLICY "carer_insert_own_visits" 
ON visit_records 
FOR INSERT 
WITH CHECK (
  staff_id IN (SELECT id FROM staff WHERE auth_user_id = auth.uid())
);