-- Clean up incorrectly created bookings (Tuesday and Wednesday bookings that should have been Saturday)
-- These were created when Saturday recurring bookings were incorrectly calculated
DELETE FROM bookings 
WHERE branch_id = '6e02b2f6-6919-4f56-8cf2-f53c700ea962' 
  AND created_at >= '2025-09-23 13:30:00'
  AND (EXTRACT(DOW FROM start_time) = 2 OR EXTRACT(DOW FROM start_time) = 3);