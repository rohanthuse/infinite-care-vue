-- Add organization_id columns to all core settings tables
ALTER TABLE hobbies 
  ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE skills 
  ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE medical_categories 
  ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE medical_conditions 
  ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE work_types 
  ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE body_map_points 
  ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_hobbies_organization_id ON hobbies(organization_id);
CREATE INDEX idx_skills_organization_id ON skills(organization_id);
CREATE INDEX idx_medical_categories_organization_id ON medical_categories(organization_id);
CREATE INDEX idx_medical_conditions_organization_id ON medical_conditions(organization_id);
CREATE INDEX idx_work_types_organization_id ON work_types(organization_id);
CREATE INDEX idx_body_map_points_organization_id ON body_map_points(organization_id);

-- Add comments for documentation
COMMENT ON COLUMN hobbies.organization_id IS 'NULL for global shared hobbies, set to specific org ID for organization-specific hobbies';
COMMENT ON COLUMN skills.organization_id IS 'NULL for global shared skills, set to specific org ID for organization-specific skills';
COMMENT ON COLUMN medical_categories.organization_id IS 'NULL for global shared categories, set to specific org ID for organization-specific categories';
COMMENT ON COLUMN medical_conditions.organization_id IS 'NULL for global shared conditions, set to specific org ID for organization-specific conditions';
COMMENT ON COLUMN work_types.organization_id IS 'NULL for global shared work types, set to specific org ID for organization-specific work types';
COMMENT ON COLUMN body_map_points.organization_id IS 'NULL for global shared body map points, set to specific org ID for organization-specific points';

-- Enable RLS on all tables
ALTER TABLE hobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_map_points ENABLE ROW LEVEL SECURITY;

-- Create policies for hobbies
CREATE POLICY "Users can view hobbies from their org or global hobbies"
  ON hobbies FOR SELECT
  USING (
    organization_id IS NULL 
    OR organization_id = get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can insert hobbies to their org"
  ON hobbies FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can update hobbies from their org"
  ON hobbies FOR UPDATE
  USING (
    organization_id = get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can delete hobbies from their org"
  ON hobbies FOR DELETE
  USING (
    organization_id = get_user_organization_id(auth.uid())
  );

-- Create policies for skills
CREATE POLICY "Users can view skills from their org or global skills"
  ON skills FOR SELECT
  USING (
    organization_id IS NULL 
    OR organization_id = get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can insert skills to their org"
  ON skills FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can update skills from their org"
  ON skills FOR UPDATE
  USING (
    organization_id = get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can delete skills from their org"
  ON skills FOR DELETE
  USING (
    organization_id = get_user_organization_id(auth.uid())
  );

-- Create policies for medical_categories
CREATE POLICY "Users can view medical categories from their org or global"
  ON medical_categories FOR SELECT
  USING (
    organization_id IS NULL 
    OR organization_id = get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can insert medical categories to their org"
  ON medical_categories FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can update medical categories from their org"
  ON medical_categories FOR UPDATE
  USING (
    organization_id = get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can delete medical categories from their org"
  ON medical_categories FOR DELETE
  USING (
    organization_id = get_user_organization_id(auth.uid())
  );

-- Create policies for medical_conditions
CREATE POLICY "Users can view medical conditions from their org or global"
  ON medical_conditions FOR SELECT
  USING (
    organization_id IS NULL 
    OR organization_id = get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can insert medical conditions to their org"
  ON medical_conditions FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can update medical conditions from their org"
  ON medical_conditions FOR UPDATE
  USING (
    organization_id = get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can delete medical conditions from their org"
  ON medical_conditions FOR DELETE
  USING (
    organization_id = get_user_organization_id(auth.uid())
  );

-- Create policies for work_types
CREATE POLICY "Users can view work types from their org or global"
  ON work_types FOR SELECT
  USING (
    organization_id IS NULL 
    OR organization_id = get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can insert work types to their org"
  ON work_types FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can update work types from their org"
  ON work_types FOR UPDATE
  USING (
    organization_id = get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can delete work types from their org"
  ON work_types FOR DELETE
  USING (
    organization_id = get_user_organization_id(auth.uid())
  );

-- Create policies for body_map_points
CREATE POLICY "Users can view body map points from their org or global"
  ON body_map_points FOR SELECT
  USING (
    organization_id IS NULL 
    OR organization_id = get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can insert body map points to their org"
  ON body_map_points FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can update body map points from their org"
  ON body_map_points FOR UPDATE
  USING (
    organization_id = get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can delete body map points from their org"
  ON body_map_points FOR DELETE
  USING (
    organization_id = get_user_organization_id(auth.uid())
  );