-- Clean up duplicate draft care plans: keep only the most recent draft per client
-- First, identify and delete older duplicates

WITH ranked_drafts AS (
  SELECT 
    id,
    client_id,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY client_id ORDER BY created_at DESC) as rn
  FROM client_care_plans
  WHERE status = 'draft'
)
DELETE FROM client_care_plans
WHERE id IN (
  SELECT id FROM ranked_drafts WHERE rn > 1
);

-- Add a comment noting this cleanup
COMMENT ON TABLE client_care_plans IS 'Care plans for clients. Only one draft per client should exist at a time.';