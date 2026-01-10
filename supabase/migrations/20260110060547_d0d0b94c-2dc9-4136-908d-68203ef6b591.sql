-- Optimized index for booking overlap check trigger
-- This dramatically speeds up the overlap check from full table scans to direct index lookups
CREATE INDEX IF NOT EXISTS idx_bookings_overlap_check 
ON bookings (staff_id, branch_id, start_time, end_time);

-- Index for branch-based booking queries (covers most filter patterns)
CREATE INDEX IF NOT EXISTS idx_bookings_branch_start 
ON bookings (branch_id, start_time);