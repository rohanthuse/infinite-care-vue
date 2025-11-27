-- Add password column to third_party_access_requests table
ALTER TABLE third_party_access_requests 
ADD COLUMN IF NOT EXISTS password text;

-- Update existing request with known password
UPDATE third_party_access_requests 
SET password = 'ashok2001' 
WHERE email = 'ashok@gmail.com';