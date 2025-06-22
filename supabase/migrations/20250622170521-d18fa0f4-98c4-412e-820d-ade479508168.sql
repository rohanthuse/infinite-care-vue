
-- Direct assignment of training records to the current carer
-- Using the specific carer ID that we identified: cc6edcee-1145-4ff3-b65f-b295706c8fc5

INSERT INTO staff_training_records (
  staff_id,
  training_course_id,
  branch_id,
  status,
  assigned_date,
  completion_date,
  expiry_date,
  score
)
SELECT 
  'cc6edcee-1145-4ff3-b65f-b295706c8fc5'::uuid as staff_id,
  tc.id as training_course_id,
  s.branch_id,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY tc.created_at) = 1 THEN 'not-started'
    WHEN ROW_NUMBER() OVER (ORDER BY tc.created_at) = 2 THEN 'in-progress'
    WHEN ROW_NUMBER() OVER (ORDER BY tc.created_at) = 3 THEN 'completed'
    WHEN ROW_NUMBER() OVER (ORDER BY tc.created_at) = 4 THEN 'completed'
    ELSE 'not-started'
  END as status,
  CURRENT_DATE - INTERVAL '30 days' as assigned_date,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY tc.created_at) IN (3, 4) THEN CURRENT_DATE - INTERVAL '10 days'
    ELSE NULL
  END as completion_date,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY tc.created_at) IN (3, 4) AND tc.valid_for_months IS NOT NULL 
    THEN (CURRENT_DATE - INTERVAL '10 days') + (tc.valid_for_months || ' months')::INTERVAL
    ELSE NULL
  END as expiry_date,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY tc.created_at) = 3 THEN 85
    WHEN ROW_NUMBER() OVER (ORDER BY tc.created_at) = 4 THEN 92
    ELSE NULL
  END as score
FROM training_courses tc
CROSS JOIN staff s
WHERE s.id = 'cc6edcee-1145-4ff3-b65f-b295706c8fc5'::uuid
  AND tc.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM staff_training_records str 
    WHERE str.staff_id = 'cc6edcee-1145-4ff3-b65f-b295706c8fc5'::uuid 
    AND str.training_course_id = tc.id
  )
LIMIT 5;
