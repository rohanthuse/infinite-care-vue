-- Complete Multi-Tenancy Data Isolation Fix - Handle All NOT NULL Constraints

-- Step 1: Allow NULL organization_id for template records in parameter tables
ALTER TABLE communication_types ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE report_types ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE file_categories ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE expense_types ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE travel_rates ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE bank_holidays ALTER COLUMN organization_id DROP NOT NULL;

-- Step 2: Create template records for all parameter types

-- Communication Types Templates
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

-- Report Types Templates  
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

-- File Categories Templates
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

-- Expense Types Templates (with correct type values)
INSERT INTO expense_types (title, status, type, amount, tax, organization_id) VALUES
('Travel Expenses', 'Active', 'Increment', 0.00, 0.00, NULL),
('Training Costs', 'Active', 'Increment', 0.00, 0.00, NULL),
('Equipment Purchase', 'Active', 'Increment', 0.00, 0.00, NULL),
('Office Supplies', 'Active', 'Increment', 0.00, 0.00, NULL),
('Medical Supplies', 'Active', 'Increment', 0.00, 0.00, NULL),
('Utilities', 'Active', 'Increment', 0.00, 0.00, NULL),
('Professional Services', 'Active', 'Increment', 0.00, 0.00, NULL)
ON CONFLICT DO NOTHING;

-- Step 3: Create comprehensive seeding function with proper constraints handling
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
  INSERT INTO expense_types (organization_id, title, status, type, amount, tax)
  SELECT org_id, title, status, type, amount, tax
  FROM expense_types 
  WHERE organization_id IS NULL
  ON CONFLICT DO NOTHING;

  -- Create specific travel rates with proper values for all required fields
  INSERT INTO travel_rates (organization_id, title, rate_per_mile, rate_per_hour, user_type, from_date, status)
  VALUES 
    (org_id, 'Standard Car Mileage', 0.45, 0.00, 'carer', CURRENT_DATE, 'Active'),
    (org_id, 'Admin Hourly Rate', 0.00, 25.00, 'admin', CURRENT_DATE, 'Active'),
    (org_id, 'Carer Hourly Rate', 0.00, 15.00, 'carer', CURRENT_DATE, 'Active'),
    (org_id, 'Senior Carer Rate', 0.00, 18.00, 'carer', CURRENT_DATE, 'Active'),
    (org_id, 'Night Shift Premium', 0.00, 20.00, 'carer', CURRENT_DATE, 'Active'),
    (org_id, 'Weekend Premium', 0.00, 17.50, 'carer', CURRENT_DATE, 'Active')
  ON CONFLICT DO NOTHING;

  -- Create default bank holidays
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

-- Step 4: Remove duplicate data, keeping only one record per organization per title
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

-- Step 5: Set up auto-seeding for new organizations
CREATE OR REPLACE FUNCTION trigger_seed_organization_parameters()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM seed_default_parameters_for_organization(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_seed_organization_parameters ON organizations;
CREATE TRIGGER auto_seed_organization_parameters
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_seed_organization_parameters();

-- Step 6: Seed all existing organizations
DO $$
DECLARE
  org_record RECORD;
  error_msg TEXT;
BEGIN
  FOR org_record IN SELECT id FROM organizations LOOP
    BEGIN
      PERFORM seed_default_parameters_for_organization(org_record.id);
      RAISE NOTICE 'Seeded parameters for organization %', org_record.id;
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
      RAISE NOTICE 'Error seeding organization %: %', org_record.id, error_msg;
    END;
  END LOOP;
END $$;