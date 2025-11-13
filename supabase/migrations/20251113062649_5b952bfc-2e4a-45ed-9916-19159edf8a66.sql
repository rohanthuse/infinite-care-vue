-- Phase 5 (Revised): Backfill service reports for existing completed visits
-- This creates service reports for all completed visits that don't have them

INSERT INTO client_service_reports (
  client_id,
  staff_id,
  visit_record_id,
  booking_id,
  branch_id,
  organization_id,
  service_date,
  service_duration_minutes,
  services_provided,
  carer_observations,
  status,
  created_by
)
SELECT 
  vr.client_id,
  vr.staff_id,
  vr.id,
  vr.booking_id,
  vr.branch_id,
  b.organization_id,
  DATE(vr.visit_start_time),
  vr.actual_duration_minutes,
  ARRAY['Home Care Visit'],
  vr.visit_notes,
  'approved', -- Auto-approve historical reports
  vr.staff_id
FROM visit_records vr
LEFT JOIN client_service_reports csr ON csr.visit_record_id = vr.id
LEFT JOIN bookings bk ON bk.id = vr.booking_id
LEFT JOIN branches b ON b.id = vr.branch_id
WHERE vr.status = 'completed'
  AND csr.id IS NULL
  AND vr.visit_end_time IS NOT NULL;