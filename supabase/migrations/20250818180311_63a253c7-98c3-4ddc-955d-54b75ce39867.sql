-- Complete Multi-Tenancy Data Isolation Fix
-- Phase 1: Create global template records (organization_id = NULL)

-- First, create template records from existing data (take from first organization)
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

INSERT INTO report_types (id, title, status, organization_id, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  title,
  status,
  NULL as organization_id,
  now() as created_at,
  now() as updated_at
FROM (
  SELECT DISTINCT ON (title) title, status
  FROM report_types 
  WHERE organization_id IS NOT NULL
  ORDER BY title, created_at
) distinct_types
ON CONFLICT DO NOTHING;

INSERT INTO file_categories (id, title, status, organization_id, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  title,
  status,
  NULL as organization_id,
  now() as created_at,
  now() as updated_at
FROM (
  SELECT DISTINCT ON (title) title, status
  FROM file_categories 
  WHERE organization_id IS NOT NULL
  ORDER BY title, created_at
) distinct_types
ON CONFLICT DO NOTHING;

INSERT INTO expense_types (id, title, status, organization_id, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  title,
  status,
  NULL as organization_id,
  now() as created_at,
  now() as updated_at
FROM (
  SELECT DISTINCT ON (title) title, status
  FROM expense_types 
  WHERE organization_id IS NOT NULL
  ORDER BY title, created_at
) distinct_types
ON CONFLICT DO NOTHING;

-- Create additional standard templates if they don't exist
INSERT INTO communication_types (title, status, organization_id) VALUES
('Email', 'Active', NULL),
('Phone Call', 'Active', NULL),
('Text Message', 'Active', NULL),
('Video Call', 'Active', NULL),
('In-Person Meeting', 'Active', NULL),
('Voicemail', 'Active', NULL),
('Letter', 'Active', NULL),
('Fax', 'Active', NULL),
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
('Behavioral Report', 'Active', NULL),
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

-- Phase 2: Create/Update comprehensive seeding function
CREATE OR REPLACE FUNCTION seed_default_parameters_for_organization(org_id UUID)
RETURNS void AS $$
BEGIN
  -- Seed Communication Types
  INSERT INTO communication_types (organization_id, title, status)
  SELECT org_id, title, status
  FROM communication_types 
  WHERE organization_id IS NULL;

  -- Seed Report Types  
  INSERT INTO report_types (organization_id, title, status)
  SELECT org_id, title, status
  FROM report_types 
  WHERE organization_id IS NULL;

  -- Seed File Categories
  INSERT INTO file_categories (organization_id, title, status)
  SELECT org_id, title, status
  FROM file_categories 
  WHERE organization_id IS NULL;

  -- Seed Expense Types
  INSERT INTO expense_types (organization_id, title, status)
  SELECT org_id, title, status
  FROM expense_types 
  WHERE organization_id IS NULL;

  -- Create default travel rates
  INSERT INTO travel_rates (organization_id, title, rate_per_mile, rate_per_hour, user_type, from_date, status)
  VALUES 
    (org_id, 'Standard Car Mileage', 0.45, NULL, 'carer', CURRENT_DATE, 'Active'),
    (org_id, 'Admin Hourly Rate', NULL, 25.00, 'admin', CURRENT_DATE, 'Active'),
    (org_id, 'Carer Hourly Rate', NULL, 15.00, 'carer', CURRENT_DATE, 'Active'),
    (org_id, 'Senior Carer Rate', NULL, 18.00, 'carer', CURRENT_DATE, 'Active'),
    (org_id, 'Night Shift Premium', NULL, 20.00, 'carer', CURRENT_DATE, 'Active'),
    (org_id, 'Weekend Premium', NULL, 17.50, 'carer', CURRENT_DATE, 'Active');

  -- Create default bank holidays (UK standard)
  INSERT INTO bank_holidays (organization_id, title, registered_by, registered_on, status)
  VALUES 
    (org_id, 'New Year''s Day', 'System', CURRENT_DATE, 'Active'),
    (org_id, 'Good Friday', 'System', CURRENT_DATE, 'Active'),
    (org_id, 'Easter Monday', 'System', CURRENT_DATE, 'Active'),
    (org_id, 'Early May Bank Holiday', 'System', CURRENT_DATE, 'Active'),
    (org_id, 'Spring Bank Holiday', 'System', CURRENT_DATE, 'Active'),
    (org_id, 'Summer Bank Holiday', 'System', CURRENT_DATE, 'Active'),
    (org_id, 'Christmas Day', 'System', CURRENT_DATE, 'Active'),
    (org_id, 'Boxing Day', 'System', CURRENT_DATE, 'Active');

  RAISE NOTICE 'Successfully seeded default parameters for organization %', org_id;
END;
$$ LANGUAGE plpgsql;

-- Phase 3: Data Deduplication - Keep only one set per organization
-- This will remove massive duplication while preserving organization-specific customizations

-- For each organization, keep only the first occurrence of each parameter type
DELETE FROM communication_types 
WHERE id NOT IN (
  SELECT DISTINCT ON (organization_id, title) id
  FROM communication_types 
  WHERE organization_id IS NOT NULL
  ORDER BY organization_id, title, created_at
);

DELETE FROM report_types 
WHERE id NOT IN (
  SELECT DISTINCT ON (organization_id, title) id
  FROM report_types 
  WHERE organization_id IS NOT NULL
  ORDER BY organization_id, title, created_at
);

DELETE FROM file_categories 
WHERE id NOT IN (
  SELECT DISTINCT ON (organization_id, title) id
  FROM file_categories 
  WHERE organization_id IS NOT NULL
  ORDER BY organization_id, title, created_at
);

DELETE FROM expense_types 
WHERE id NOT IN (
  SELECT DISTINCT ON (organization_id, title) id
  FROM expense_types 
  WHERE organization_id IS NOT NULL
  ORDER BY organization_id, title, created_at
);

-- Phase 4: Create trigger to auto-seed new organizations
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

-- Phase 5: Seed existing organizations that might be missing parameters
DO $$
DECLARE
  org_record RECORD;
  missing_params BOOLEAN;
BEGIN
  FOR org_record IN SELECT id FROM organizations LOOP
    -- Check if organization is missing any parameter types
    missing_params := FALSE;
    
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
    
    IF NOT EXISTS (SELECT 1 FROM travel_rates WHERE organization_id = org_record.id) THEN
      missing_params := TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM bank_holidays WHERE organization_id = org_record.id) THEN
      missing_params := TRUE;
    END IF;
    
    -- If missing any parameters, seed them
    IF missing_params THEN
      PERFORM seed_default_parameters_for_organization(org_record.id);
      RAISE NOTICE 'Seeded missing parameters for organization %', org_record.id;
    END IF;
  END LOOP;
END $$;