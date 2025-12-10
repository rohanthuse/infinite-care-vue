-- Fix the corrupted booking record where end_time date differs from start_time date
UPDATE bookings 
SET end_time = '2025-12-10T07:45:00+00:00'
WHERE id = '873fec26-8832-409a-a88d-6f1f55f5930a';