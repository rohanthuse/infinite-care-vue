-- First, clean up duplicate drafts: keep only the most recent draft per client
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

-- Add a partial unique index to prevent duplicate drafts at the database level
-- This ensures only ONE draft care plan can exist per client
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_draft_per_client 
ON client_care_plans (client_id) 
WHERE status = 'draft';