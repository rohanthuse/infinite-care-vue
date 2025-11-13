-- Add critical performance indexes for visit workflow

-- Index on staff.auth_user_id for faster RLS policy lookups
CREATE INDEX IF NOT EXISTS idx_staff_auth_user_id ON staff(auth_user_id);

-- Composite index on bookings for staff-related queries
CREATE INDEX IF NOT EXISTS idx_bookings_staff_id ON bookings(staff_id, id);

-- Index on visit_records for faster lookups
CREATE INDEX IF NOT EXISTS idx_visit_records_staff_id ON visit_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_visit_records_booking_id ON visit_records(booking_id);

-- Indexes for related visit tables
CREATE INDEX IF NOT EXISTS idx_visit_tasks_visit_record_id ON visit_tasks(visit_record_id);
CREATE INDEX IF NOT EXISTS idx_visit_medications_visit_record_id ON visit_medications(visit_record_id);
CREATE INDEX IF NOT EXISTS idx_visit_vitals_visit_record_id ON visit_vitals(visit_record_id);
CREATE INDEX IF NOT EXISTS idx_visit_events_visit_record_id ON visit_events(visit_record_id);