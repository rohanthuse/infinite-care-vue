-- Fix duplicate organization members issue
-- Remove organization_members entries that are duplicates of System Portal users

-- Step 1: Clean up existing duplicate organization_members records
-- Delete organization_members entries where the user_id matches a System Portal user's auth_user_id
DELETE FROM organization_members om
USING system_users su
WHERE om.user_id = su.auth_user_id
  AND su.auth_user_id IS NOT NULL;

-- Step 2: Sync profile names from system_users for System Portal users
-- This ensures if a System Portal user appears in any user context, their name displays correctly
UPDATE profiles p
SET 
  first_name = su.first_name,
  last_name = su.last_name,
  updated_at = now()
FROM system_users su
WHERE p.id = su.auth_user_id
  AND su.auth_user_id IS NOT NULL
  AND (p.first_name IS NULL OR p.last_name IS NULL OR p.first_name = '' OR p.last_name = '');

-- Step 3: Add comment for documentation
COMMENT ON FUNCTION sync_system_user_to_organization IS 
  'Syncs System Portal users to organizations. Note: Creates entries in both system_user_organizations and organization_members for backwards compatibility. UI should deduplicate by excluding organization_members records where user_id matches a System Portal user''s auth_user_id.';