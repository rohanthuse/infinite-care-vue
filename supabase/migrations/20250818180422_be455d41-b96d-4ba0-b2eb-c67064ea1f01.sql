-- Fix Multi-Tenancy Data Isolation - Handle NOT NULL constraints properly

-- Step 1: Temporarily allow NULL organization_id for template records
ALTER TABLE communication_types ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE report_types ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE file_categories ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE expense_types ALTER COLUMN organization_id DROP NOT NULL;

-- Step 2: Create template records with organization_id = NULL
INSERT INTO communication_types (id, title, status, organization_id, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  title,
  status,
  NULL as organization_id,
  now() as created_at,
  now() as updated_at
FROM (
  SELECT DISTINCT ON (title) title, status
  FROM communication_types 
  WHERE organization_id IS NOT NULL
  ORDER BY title, created_at
) distinct_types
ON CONFLICT DO NOTHING;

-- Add standard communication types templates
INSERT INTO communication_types (title, status, organization_id) VALUES
('Email', 'Active', NULL),
('Phone Call', 'Active', NULL),
('Text Message', 'Active', NULL),
('Video Call', 'Active', NULL),
('In-Person Meeting', 'Active', NULL),
('Voicemail', 'Active', NULL),
('Letter', 'Active', NULL),
('Emergency Contact', 'Active', NULL),
('Family Update', 'Active', NULL),
('Medical Consultation', 'Active', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO report_types (title, status, organization_id) VALUES
('Incident Report', 'Active', NULL),
('Progress Report', 'Active', NULL),
('Medical Report', 'Active', NULL),
('Safeguarding Report', 'Active', NULL),
('Medication Report', 'Active', NULL),
('Care Plan Review', 'Active', NULL),
('Risk Assessment', 'Active', NULL),
('Complaint Report', 'Active', NULL),
('Quality Assurance', 'Active', NULL),
('Training Report', 'Active', NULL),
('Health & Safety Report', 'Active', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO file_categories (title, status, organization_id) VALUES
('Care Plans', 'Active', NULL),
('Medical Records', 'Active', NULL),
('Legal Documents', 'Active', NULL),
('Insurance Documents', 'Active', NULL),
('Training Certificates', 'Active', NULL),
('DBS Certificates', 'Active', NULL),
('Personal Documents', 'Active', NULL),
('Assessment Forms', 'Active', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO expense_types (title, status, organization_id) VALUES
('Travel Expenses', 'Active', NULL),
('Training Costs', 'Active', NULL),
('Equipment Purchase', 'Active', NULL),
('Office Supplies', 'Active', NULL),
('Medical Supplies', 'Active', NULL),
('Utilities', 'Active', NULL),
('Professional Services', 'Active', NULL)
ON CONFLICT DO NOTHING;

-- Step 3: Create comprehensive seeding function
CREATE OR REPLACE FUNCTION seed_default_parameters_for_organization(org_id UUID)
RETURNS void AS $$
BEGIN
  -- Seed Communication Types
  INSERT INTO communication_types (organization_id, title, status)
  SELECT org_id, title, status
  FROM communication_types 
  WHERE organization_id IS NULL
  ON CONFLICT DO NOTHING;

  -- Seed Report Types  
  INSERT INTO report_types (organization_id, title, status)
  SELECT org_id, title, status
  FROM report_types 
  WHERE organization_id IS NULL
  ON CONFLICT DO NOTHING;

  -- Seed File Categories
  INSERT INTO file_categories (organization_id, title, status)
  SELECT org_id, title, status
  FROM file_categories 
  WHERE organization_id IS NULL
  ON CONFLICT DO NOTHING;

  -- Seed Expense Types
  INSERT INTO expense_types (organization_id, title, status)
  SELECT org_id, title, status
  FROM expense_types 
  WHERE organization_id IS NULL
  ON CONFLICT DO NOTHING;

  -- Create default travel rates if table exists
  INSERT INTO travel_rates (organization_id, title, rate_per_mile, rate_per_hour, user_type, from_date, status)
  VALUES 
    (org_id, 'Standard Car Mileage', 0.45, NULL, 'carer', CURRENT_DATE, 'Active'),
    (org_id, 'Admin Hourly Rate', NULL, 25.00, 'admin', CURRENT_DATE, 'Active'),
    (org_id, 'Carer Hourly Rate', NULL, 15.00, 'carer', CURRENT_DATE, 'Active'),
    (org_id, 'Senior Carer Rate', NULL, 18.00, 'carer', CURRENT_DATE, 'Active'),
    (org_id, 'Night Shift Premium', NULL, 20.00, 'carer', CURRENT_DATE, 'Active'),
    (org_id, 'Weekend Premium', NULL, 17.50, 'carer', CURRENT_DATE, 'Active')
  ON CONFLICT DO NOTHING;

  -- Create default bank holidays if table exists
  INSERT INTO bank_holidays (organization_id, title, registered_by, registered_on, status)
  VALUES 
    (org_id, 'New Year''s Day', 'System', CURRENT_DATE, 'Active'),
    (org_id, 'Good Friday', 'System', CURRENT_DATE, 'Active'),
    (org_id, 'Easter Monday', 'System', CURRENT_DATE, 'Active'),
    (org_id, 'Early May Bank Holiday', 'System', CURRENT_DATE, 'Active'),
    (org_id, 'Spring Bank Holiday', 'System', CURRENT_DATE, 'Active'),
    (org_id, 'Summer Bank Holiday', 'System', CURRENT_DATE, 'Active'),
    (org_id, 'Christmas Day', 'System', CURRENT_DATE, 'Active'),
    (org_id, 'Boxing Day', 'System', CURRENT_DATE, 'Active')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Successfully seeded default parameters for organization %', org_id;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Data deduplication - remove duplicates while keeping one per organization
DELETE FROM communication_types 
WHERE organization_id IS NOT NULL 
AND id NOT IN (
  SELECT DISTINCT ON (organization_id, title) id
  FROM communication_types 
  WHERE organization_id IS NOT NULL
  ORDER BY organization_id, title, created_at
);

DELETE FROM report_types 
WHERE organization_id IS NOT NULL 
AND id NOT IN (
  SELECT DISTINCT ON (organization_id, title) id
  FROM report_types 
  WHERE organization_id IS NOT NULL
  ORDER BY organization_id, title, created_at
);

DELETE FROM file_categories 
WHERE organization_id IS NOT NULL 
AND id NOT IN (
  SELECT DISTINCT ON (organization_id, title) id
  FROM file_categories 
  WHERE organization_id IS NOT NULL
  ORDER BY organization_id, title, created_at
);

DELETE FROM expense_types 
WHERE organization_id IS NOT NULL 
AND id NOT IN (
  SELECT DISTINCT ON (organization_id, title) id
  FROM expense_types 
  WHERE organization_id IS NOT NULL
  ORDER BY organization_id, title, created_at
);

-- Step 5: Create trigger for auto-seeding new organizations
CREATE OR REPLACE FUNCTION trigger_seed_organization_parameters()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-seed parameters when new organization is created
  PERFORM seed_default_parameters_for_organization(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS auto_seed_organization_parameters ON organizations;
CREATE TRIGGER auto_seed_organization_parameters
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_seed_organization_parameters();

-- Step 6: Seed any existing organizations missing parameters
DO $$
DECLARE
  org_record RECORD;
  missing_params BOOLEAN;
BEGIN
  FOR org_record IN SELECT id FROM organizations LOOP
    missing_params := FALSE;
    
    -- Check for missing parameter types
    IF NOT EXISTS (SELECT 1 FROM communication_types WHERE organization_id = org_record.id) THEN
      missing_params := TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM report_types WHERE organization_id = org_record.id) THEN
      missing_params := TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM file_categories WHERE organization_id = org_record.id) THEN
      missing_params := TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM expense_types WHERE organization_id = org_record.id) THEN
      missing_params := TRUE;
    END IF;
    
    -- Seed if missing any parameters
    IF missing_params THEN
      PERFORM seed_default_parameters_for_organization(org_record.id);
      RAISE NOTICE 'Seeded missing parameters for organization %', org_record.id;
    END IF;
  END LOOP;
END $$;