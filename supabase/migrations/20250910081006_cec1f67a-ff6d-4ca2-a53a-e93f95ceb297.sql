-- Enhanced compliance reports function with carer performance and medication tracking
CREATE OR REPLACE FUNCTION public.get_enhanced_compliance_reports_data(
    p_branch_id uuid, 
    p_start_date date DEFAULT NULL::date, 
    p_end_date date DEFAULT NULL::date
)
RETURNS json
LANGUAGE plpgsql
AS $function$
DECLARE
  result JSON;
  start_date DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '6 months');
  end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
BEGIN
  WITH training_compliance AS (
    SELECT 
      'DBS Checks' as training_type,
      COUNT(CASE WHEN s.dbs_status = 'valid' THEN 1 END) as compliant,
      COUNT(CASE WHEN s.dbs_status != 'valid' OR s.dbs_status IS NULL THEN 1 END) as noncompliant
    FROM staff s
    WHERE s.branch_id = p_branch_id AND s.status = 'active'
    UNION ALL
    SELECT 
      'First Aid' as training_type,
      COUNT(CASE WHEN s.qualifications IS NOT NULL AND 'First Aid' = ANY(s.qualifications) THEN 1 END) as compliant,
      COUNT(CASE WHEN s.qualifications IS NULL OR NOT 'First Aid' = ANY(s.qualifications) THEN 1 END) as noncompliant
    FROM staff s
    WHERE s.branch_id = p_branch_id AND s.status = 'active'
    UNION ALL
    SELECT 
      'Safeguarding' as training_type,
      COUNT(CASE WHEN s.qualifications IS NOT NULL AND 'Safeguarding' = ANY(s.qualifications) THEN 1 END) as compliant,
      COUNT(CASE WHEN s.qualifications IS NULL OR NOT 'Safeguarding' = ANY(s.qualifications) THEN 1 END) as noncompliant
    FROM staff s
    WHERE s.branch_id = p_branch_id AND s.status = 'active'
  ),
  incident_types AS (
    SELECT 
      cel.category as incident_type,
      COUNT(*) as count
    FROM client_events_logs cel
    WHERE cel.branch_id = p_branch_id
      AND DATE(cel.created_at) BETWEEN start_date AND end_date
      AND cel.category IS NOT NULL
    GROUP BY cel.category
    ORDER BY count DESC
    LIMIT 5
  ),
  compliance_trends AS (
    SELECT 
      TO_CHAR(DATE_TRUNC('month', cel.created_at), 'Mon') as month,
      COUNT(*) as incidents
    FROM client_events_logs cel
    WHERE cel.branch_id = p_branch_id
      AND DATE(cel.created_at) BETWEEN start_date AND end_date
    GROUP BY DATE_TRUNC('month', cel.created_at)
    ORDER BY DATE_TRUNC('month', cel.created_at)
  ),
  carer_performance AS (
    SELECT 
      CONCAT(s.first_name, ' ', s.last_name) as carer_name,
      s.id as carer_id,
      -- Count missed visits (bookings without corresponding visit records)
      COUNT(CASE WHEN b.id IS NOT NULL AND vr.id IS NULL AND b.status = 'cancelled' THEN 1 END) as missed_calls,
      -- Count late arrivals from attendance records
      COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as late_arrivals,
      -- Count total scheduled bookings
      COUNT(b.id) as total_bookings,
      -- Calculate reliability percentage
      CASE 
        WHEN COUNT(b.id) > 0 THEN 
          ROUND((COUNT(b.id) - COUNT(CASE WHEN b.id IS NOT NULL AND vr.id IS NULL AND b.status = 'cancelled' THEN 1 END)) * 100.0 / COUNT(b.id), 1)
        ELSE 100.0
      END as reliability_percentage
    FROM staff s
    LEFT JOIN bookings b ON s.id = b.staff_id 
      AND DATE(b.start_time) BETWEEN start_date AND end_date
      AND b.branch_id = p_branch_id
    LEFT JOIN visit_records vr ON b.id = vr.booking_id
    LEFT JOIN attendance_records ar ON s.id = ar.staff_id 
      AND DATE(ar.date) BETWEEN start_date AND end_date
    WHERE s.branch_id = p_branch_id AND s.status = 'active'
    GROUP BY s.id, s.first_name, s.last_name
    HAVING COUNT(b.id) > 0
    ORDER BY missed_calls DESC, late_arrivals DESC
  ),
  medication_administration AS (
    SELECT 
      CONCAT(c.first_name, ' ', c.last_name) as client_name,
      c.id as client_id,
      vm.medication_name,
      vm.dosage,
      vm.administration_method,
      TO_CHAR(vm.administration_time, 'YYYY-MM-DD HH24:MI') as administered_at,
      CASE WHEN vm.is_administered THEN 'Administered' ELSE 'Missed' END as status,
      vm.administration_notes,
      vm.missed_reason,
      vm.side_effects_observed,
      CONCAT(s.first_name, ' ', s.last_name) as administered_by_name
    FROM visit_medications vm
    JOIN visit_records vr ON vm.visit_record_id = vr.id
    JOIN clients c ON vr.client_id = c.id
    LEFT JOIN staff s ON vm.administered_by = s.id
    WHERE vr.branch_id = p_branch_id
      AND DATE(COALESCE(vm.administration_time, vr.visit_date)) BETWEEN start_date AND end_date
    ORDER BY vm.administration_time DESC
    LIMIT 100
  ),
  medication_summary AS (
    SELECT 
      COUNT(*) as total_medications,
      COUNT(CASE WHEN vm.is_administered THEN 1 END) as administered_count,
      COUNT(CASE WHEN NOT vm.is_administered THEN 1 END) as missed_count,
      ROUND(COUNT(CASE WHEN vm.is_administered THEN 1 END) * 100.0 / COUNT(*), 1) as administration_rate
    FROM visit_medications vm
    JOIN visit_records vr ON vm.visit_record_id = vr.id
    WHERE vr.branch_id = p_branch_id
      AND DATE(COALESCE(vm.administration_time, vr.visit_date)) BETWEEN start_date AND end_date
  )
  SELECT json_build_object(
    'trainingCompliance', COALESCE((SELECT json_agg(
      json_build_object(
        'name', training_type,
        'compliant', compliant,
        'noncompliant', noncompliant
      )
    ) FROM training_compliance), '[]'::json),
    'incidentTypes', COALESCE((SELECT json_agg(
      json_build_object(
        'name', incident_type,
        'value', count
      )
    ) FROM incident_types), '[]'::json),
    'complianceTrends', COALESCE((SELECT json_agg(
      json_build_object(
        'month', month,
        'incidents', incidents
      )
    ) FROM compliance_trends), '[]'::json),
    'carerPerformance', COALESCE((SELECT json_agg(
      json_build_object(
        'carerName', carer_name,
        'carerId', carer_id,
        'missedCalls', missed_calls,
        'lateArrivals', late_arrivals,
        'totalBookings', total_bookings,
        'reliabilityPercentage', reliability_percentage
      )
    ) FROM carer_performance), '[]'::json),
    'medicationAdministration', COALESCE((SELECT json_agg(
      json_build_object(
        'clientName', client_name,
        'clientId', client_id,
        'medicationName', medication_name,
        'dosage', dosage,
        'administrationMethod', administration_method,
        'administeredAt', administered_at,
        'status', status,
        'administrationNotes', administration_notes,
        'missedReason', missed_reason,
        'sideEffectsObserved', side_effects_observed,
        'administeredByName', administered_by_name
      )
    ) FROM medication_administration), '[]'::json),
    'medicationSummary', COALESCE((SELECT json_build_object(
      'totalMedications', total_medications,
      'administeredCount', administered_count,
      'missedCount', missed_count,
      'administrationRate', administration_rate
    ) FROM medication_summary), json_build_object(
      'totalMedications', 0,
      'administeredCount', 0,
      'missedCount', 0,
      'administrationRate', 0
    ))
  ) INTO result;
  
  RETURN result;
END;
$function$