-- Update visit_records RLS policy to include super_admin access
DROP POLICY IF EXISTS "Branch staff can manage visit records" ON visit_records;

CREATE POLICY "Branch staff and super admins can manage visit records"
ON visit_records FOR ALL
TO public
USING (
  -- Super admins can access all visit records
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
  OR
  -- Branch staff and admins can access their branch's visit records
  branch_id IN (
    SELECT s.branch_id FROM staff s WHERE s.auth_user_id = auth.uid()
    UNION
    SELECT ab.branch_id FROM admin_branches ab WHERE ab.admin_id = auth.uid()
  )
);

-- Update can_access_visit_record function to include super_admin check
CREATE OR REPLACE FUNCTION can_access_visit_record(_user_id uuid, _visit_record_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    -- Super admins can access all visit records
    SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = 'super_admin'
  )
  OR EXISTS (
    -- Branch staff and admins can access their branch's visit records
    SELECT 1 FROM visit_records vr
    WHERE vr.id = _visit_record_id
      AND (
        vr.branch_id IN (SELECT s.branch_id FROM staff s WHERE s.auth_user_id = _user_id)
        OR
        vr.branch_id IN (SELECT ab.branch_id FROM admin_branches ab WHERE ab.admin_id = _user_id)
      )
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public';

-- Update visit_vitals RLS policy to include super_admin access
DROP POLICY IF EXISTS "Branch staff can manage visit vitals" ON visit_vitals;

CREATE POLICY "Branch staff and super admins can manage visit vitals"
ON visit_vitals FOR ALL
TO public
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  OR
  visit_record_id IN (
    SELECT vr.id FROM visit_records vr
    WHERE vr.branch_id IN (
      SELECT s.branch_id FROM staff s WHERE s.auth_user_id = auth.uid()
      UNION
      SELECT ab.branch_id FROM admin_branches ab WHERE ab.admin_id = auth.uid()
    )
  )
);

-- Update visit_events RLS policy to include super_admin access
DROP POLICY IF EXISTS "Branch staff can manage visit events" ON visit_events;

CREATE POLICY "Branch staff and super admins can manage visit events"
ON visit_events FOR ALL
TO public
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  OR
  visit_record_id IN (
    SELECT vr.id FROM visit_records vr
    WHERE vr.branch_id IN (
      SELECT s.branch_id FROM staff s WHERE s.auth_user_id = auth.uid()
      UNION
      SELECT ab.branch_id FROM admin_branches ab WHERE ab.admin_id = auth.uid()
    )
  )
);