-- Fix database data integrity: Associate branches with organizations
-- Update orphaned branches to belong to appropriate organizations
-- For demo purposes, let's associate some branches with Audi organization

UPDATE branches 
SET organization_id = '69da7623-6366-4ca2-b0fc-30e80858b469', updated_at = now()
WHERE name IN ('Test Branch Today 001 edit', 'Baner-B', 'Balewadi FIRE', 'Text Branch 002')
AND organization_id IS NULL;

-- Update any remaining NULL organization_id branches to belong to a default organization
-- We'll use Purecare as the default since it already has some branches
UPDATE branches 
SET organization_id = 'ef011224-994a-44d9-abad-2b258fa00d09', updated_at = now()
WHERE organization_id IS NULL;