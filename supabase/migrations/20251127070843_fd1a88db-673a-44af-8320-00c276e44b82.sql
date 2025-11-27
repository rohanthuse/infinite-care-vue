-- Create client record for existing third-party user (ashok@gmail.com)
INSERT INTO clients (auth_user_id, first_name, last_name, email, branch_id, status)
SELECT 
  'b60f691d-3204-4671-85af-7d5ef2ce7358'::uuid,
  'ashok',
  'b',
  'ashok@gmail.com',
  'f9ab522a-9321-4c6f-8c1b-a816441b5af3'::uuid,
  'Active'
WHERE NOT EXISTS (
  SELECT 1 FROM clients WHERE auth_user_id = 'b60f691d-3204-4671-85af-7d5ef2ce7358'::uuid
);

-- Create third_party_users record for expiry tracking
INSERT INTO third_party_users (request_id, branch_id, auth_user_id, email, first_name, surname, access_type, access_expires_at, is_active)
SELECT
  'd3b5b3b7-24c2-49e5-b5c5-5a624a3be850'::uuid,
  'f9ab522a-9321-4c6f-8c1b-a816441b5af3'::uuid,
  'b60f691d-3204-4671-85af-7d5ef2ce7358'::uuid,
  'ashok@gmail.com',
  'ashok',
  'b',
  'client',
  '2025-11-29 06:56:00+00'::timestamptz,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM third_party_users WHERE auth_user_id = 'b60f691d-3204-4671-85af-7d5ef2ce7358'::uuid
);