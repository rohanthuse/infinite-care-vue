-- Add dedicated postcode column to staff table
ALTER TABLE staff ADD COLUMN IF NOT EXISTS postcode TEXT;

-- Backfill existing postcodes from address field where possible
-- This extracts UK postcodes (e.g., SW1A 1AA) from the address string
UPDATE staff 
SET postcode = UPPER(TRIM(
  (regexp_match(address, '([A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2})', 'i'))[1]
))
WHERE postcode IS NULL 
AND address IS NOT NULL 
AND address ~ '[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}';

-- Also extract 6-digit PIN codes (Indian format)
UPDATE staff 
SET postcode = (regexp_match(address, '(\d{6})'))[1]
WHERE postcode IS NULL 
AND address IS NOT NULL 
AND address ~ '\d{6}';