
-- Clean up existing care plan with 'TEMP' display_id and assign it a proper sequential ID
UPDATE public.client_care_plans 
SET display_id = 'CP-' || LPAD((
  SELECT COALESCE(MAX(CAST(SUBSTRING(display_id FROM 4) AS INTEGER)), 0) + 1
  FROM public.client_care_plans 
  WHERE display_id ~ '^CP-[0-9]+$'
)::TEXT, 3, '0')
WHERE display_id = 'TEMP';
