-- Phase 1: Clean up duplicate change requests
-- Keep only the most recent change request per booking
DELETE FROM booking_change_requests
WHERE id NOT IN (
  SELECT DISTINCT ON (booking_id, request_type)
    id
  FROM booking_change_requests
  WHERE status = 'pending'
  ORDER BY booking_id, request_type, created_at DESC
);

-- Phase 2: Ensure current admin has access to Sai Square branch
-- Get the current user and add them to admin_branches if not already there
DO $$
DECLARE
  current_user_id uuid;
  sai_square_branch_id uuid := 'f9ab522a-9321-4c6f-8c1b-a816441b5af3';
BEGIN
  -- Get the current authenticated user
  current_user_id := auth.uid();
  
  -- Insert into admin_branches if not exists
  IF current_user_id IS NOT NULL THEN
    INSERT INTO admin_branches (admin_id, branch_id)
    VALUES (current_user_id, sai_square_branch_id)
    ON CONFLICT (admin_id, branch_id) DO NOTHING;
  END IF;
END $$;