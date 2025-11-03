-- Add code column to services table
ALTER TABLE services 
  ADD COLUMN code text;

-- Generate codes from existing titles (lowercase, replace special chars with underscores)
UPDATE services 
  SET code = lower(regexp_replace(title, '[^a-zA-Z0-9]+', '_', 'g'));

-- Remove trailing/leading underscores
UPDATE services 
  SET code = trim(both '_' from code);

-- Add unique constraint on code
ALTER TABLE services 
  ADD CONSTRAINT services_code_unique UNIQUE (code);

-- Add comment for documentation
COMMENT ON COLUMN services.code IS 'Unique code identifier for the service, auto-generated from title';
