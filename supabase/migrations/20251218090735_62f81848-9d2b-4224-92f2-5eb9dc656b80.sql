-- Migration to sync existing care plan staff_id values to the junction table
-- This ensures backward compatibility for care plans created before multi-staff support

INSERT INTO care_plan_staff_assignments (care_plan_id, staff_id, is_primary, assigned_at)
SELECT 
  id as care_plan_id, 
  staff_id, 
  true as is_primary,
  COALESCE(created_at, now()) as assigned_at
FROM client_care_plans
WHERE staff_id IS NOT NULL
ON CONFLICT (care_plan_id, staff_id) DO NOTHING;