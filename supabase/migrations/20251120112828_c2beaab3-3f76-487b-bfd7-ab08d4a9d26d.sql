-- Activate organization member for abc@gmail.com
UPDATE organization_members
SET status = 'active', updated_at = now()
WHERE user_id = 'f954701c-b3f2-4178-b926-13256c31b8b1'
AND organization_id = (SELECT id FROM organizations WHERE slug = 'xyz');