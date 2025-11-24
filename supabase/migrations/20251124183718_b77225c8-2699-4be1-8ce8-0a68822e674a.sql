-- Fix: Add super_admin role for harshal@gmail.com
INSERT INTO user_roles (user_id, role)
VALUES ('449266e9-1ec4-410e-8d79-09dd5647436a', 'super_admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';

-- Add comment for tracking
COMMENT ON TABLE user_roles IS 'Stores system-level roles for users. Must be kept in sync with organization_members for super admins.';