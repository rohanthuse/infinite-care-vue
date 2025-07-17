-- Update default status for new care plans to be 'draft' instead of 'pending_approval'
-- This is already correctly implemented in the application code, but ensuring consistency

-- No database changes needed as the application code already creates care plans with 'draft' status
-- and the staff approval workflow moves them to 'pending_approval' status

-- Just adding a comment to track that this workflow is now implemented