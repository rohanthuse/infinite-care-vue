-- Add source_system_id columns to tenant tables
ALTER TABLE services ADD COLUMN source_system_id UUID REFERENCES system_services(id) ON DELETE SET NULL;
ALTER TABLE hobbies ADD COLUMN source_system_id UUID REFERENCES system_hobbies(id) ON DELETE SET NULL;
ALTER TABLE skills ADD COLUMN source_system_id UUID REFERENCES system_skills(id) ON DELETE SET NULL;
ALTER TABLE work_types ADD COLUMN source_system_id UUID REFERENCES system_work_types(id) ON DELETE SET NULL;
ALTER TABLE body_map_points ADD COLUMN source_system_id UUID REFERENCES system_body_map_points(id) ON DELETE SET NULL;