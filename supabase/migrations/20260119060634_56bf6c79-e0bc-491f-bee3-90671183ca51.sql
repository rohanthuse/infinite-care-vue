-- Fix historical rate records by setting created_by_name for legacy rates
UPDATE service_rates 
SET created_by_name = 'Admin (legacy)'
WHERE created_by_name IS NULL;