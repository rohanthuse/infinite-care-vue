
-- Assign vishalg@gmail.com to the google organization
-- This ensures all super admins have an organization assigned

INSERT INTO system_user_organizations (system_user_id, organization_id)
SELECT 
  su.id,
  o.id
FROM system_users su
CROSS JOIN organizations o
WHERE su.email = 'vishalg@gmail.com'
  AND o.slug = 'google'
  AND NOT EXISTS (
    SELECT 1 
    FROM system_user_organizations suo 
    WHERE suo.system_user_id = su.id
  )
ON CONFLICT DO NOTHING;
