
-- First, let's get the current carer's information and assign them training records
-- We'll create a mix of training statuses to demonstrate the full functionality

-- Insert training records for the current carer with various statuses
-- We'll use the existing training courses and assign them to a carer
WITH current_carer AS (
  SELECT id, branch_id 
  FROM staff 
  WHERE email = (
    SELECT email 
    FROM auth.users 
    WHERE id = auth.uid()
  )
  LIMIT 1
),
existing_courses AS (
  SELECT id, title, is_mandatory, valid_for_months
  FROM training_courses 
  WHERE status = 'active'
  LIMIT 5
)
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
  cc.id,
  ec.id,
  cc.branch_id,
  CASE 
    WHEN ROW_NUMBER() OVER () = 1 THEN 'not-started'
    WHEN ROW_NUMBER() OVER () = 2 THEN 'in-progress'
    WHEN ROW_NUMBER() OVER () = 3 THEN 'completed'
    WHEN ROW_NUMBER() OVER () = 4 THEN 'completed'
    ELSE 'not-started'
  END as status,
  CURRENT_DATE - INTERVAL '30 days' as assigned_date,
  CASE 
    WHEN ROW_NUMBER() OVER () IN (3, 4) THEN CURRENT_DATE - INTERVAL '10 days'
    ELSE NULL
  END as completion_date,
  CASE 
    WHEN ROW_NUMBER() OVER () IN (3, 4) AND ec.valid_for_months IS NOT NULL 
    THEN (CURRENT_DATE - INTERVAL '10 days') + (ec.valid_for_months || ' months')::INTERVAL
    ELSE NULL
  END as expiry_date,
  CASE 
    WHEN ROW_NUMBER() OVER () = 3 THEN 85
    WHEN ROW_NUMBER() OVER () = 4 THEN 92
    ELSE NULL
  END as score
FROM current_carer cc
CROSS JOIN existing_courses ec
WHERE NOT EXISTS (
  SELECT 1 FROM staff_training_records str 
  WHERE str.staff_id = cc.id AND str.training_course_id = ec.id
);
