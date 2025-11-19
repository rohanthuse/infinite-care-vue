-- Remove global data access from RLS policies - enforce strict organization isolation

-- Hobbies - strict organization-only access
DROP POLICY IF EXISTS "Users can view hobbies from their org or global hobbies" ON hobbies;
CREATE POLICY "Users can only view hobbies from their org"
  ON hobbies FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

-- Skills - strict organization-only access
DROP POLICY IF EXISTS "Users can view skills from their org or global skills" ON skills;
CREATE POLICY "Users can only view skills from their org"
  ON skills FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

-- Medical Categories - strict organization-only access
DROP POLICY IF EXISTS "Users can view medical_categories from their org or global medical_categories" ON medical_categories;
CREATE POLICY "Users can only view medical_categories from their org"
  ON medical_categories FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

-- Medical Conditions - strict organization-only access
DROP POLICY IF EXISTS "Users can view medical_conditions from their org or global medical_conditions" ON medical_conditions;
CREATE POLICY "Users can only view medical_conditions from their org"
  ON medical_conditions FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

-- Work Types - strict organization-only access
DROP POLICY IF EXISTS "Users can view work_types from their org or global work_types" ON work_types;
CREATE POLICY "Users can only view work_types from their org"
  ON work_types FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

-- Body Map Points - strict organization-only access
DROP POLICY IF EXISTS "Users can view body_map_points from their org or global body_map_points" ON body_map_points;
CREATE POLICY "Users can only view body_map_points from their org"
  ON body_map_points FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

-- Clean up: Delete all global (NULL organization_id) records
-- Each organization should start completely empty
-- Delete in correct order to respect foreign key constraints
DELETE FROM hobbies WHERE organization_id IS NULL;
DELETE FROM skills WHERE organization_id IS NULL;
DELETE FROM work_types WHERE organization_id IS NULL;
DELETE FROM medical_conditions WHERE organization_id IS NULL;  -- Delete child records first
DELETE FROM medical_categories WHERE organization_id IS NULL;  -- Then delete parent records
DELETE FROM body_map_points WHERE organization_id IS NULL;