-- Phase 1: Critical Database Optimizations
-- Add missing indexes on bookings table to speed up RLS policy checks

-- Critical: Speed up RLS policy checks on staff_id
CREATE INDEX IF NOT EXISTS idx_bookings_staff_id ON bookings(staff_id);

-- Speed up other common queries
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_branch_id ON bookings(branch_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date_range ON bookings(start_time, end_time);

-- Composite index for exact RLS policy patterns
CREATE INDEX IF NOT EXISTS idx_bookings_staff_status ON bookings(staff_id, status);

-- Phase 2: Optimize RLS policies on visit_records
-- Replace inefficient policies with optimized versions

DROP POLICY IF EXISTS "Carers can update their own visit records" ON visit_records;

CREATE POLICY "Carers can update their own visit records"
ON visit_records
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    LEFT JOIN staff s ON s.id = b.staff_id
    WHERE b.id = visit_records.booking_id
      AND (b.staff_id = auth.uid() OR s.auth_user_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings b
    LEFT JOIN staff s ON s.id = b.staff_id
    WHERE b.id = visit_records.booking_id
      AND (b.staff_id = auth.uid() OR s.auth_user_id = auth.uid())
  )
);

-- Phase 3: Increase statement timeout temporarily
ALTER DATABASE postgres SET statement_timeout = '30s';

-- Phase 4: Update RLS policies for client_service_reports to allow staff creation
DROP POLICY IF EXISTS "Staff can create their own service reports" ON client_service_reports;

CREATE POLICY "Staff can create their own service reports"
ON client_service_reports 
FOR INSERT
WITH CHECK (
  staff_id = auth.uid()
  OR staff_id IN (SELECT id FROM staff WHERE auth_user_id = auth.uid())
);

DROP POLICY IF EXISTS "Staff can view their own service reports" ON client_service_reports;

CREATE POLICY "Staff can view their own service reports"
ON client_service_reports 
FOR SELECT
USING (
  staff_id = auth.uid()
  OR staff_id IN (SELECT id FROM staff WHERE auth_user_id = auth.uid())
  OR branch_id IN (
    SELECT branch_id FROM admin_branches WHERE admin_id = auth.uid()
  )
);