-- Fix the get_enhanced_compliance_reports_data function to use correct column names
CREATE OR REPLACE FUNCTION public.get_enhanced_compliance_reports_data(
  p_branch_id uuid,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
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
      'DBS Checks' as name,
      COUNT(CASE WHEN s.dbs_status = 'valid' THEN 1 END) as compliant,
      COUNT(CASE WHEN s.dbs_status != 'valid' OR s.dbs_status IS NULL THEN 1 END) as noncompliant
    FROM staff s
    WHERE s.branch_id = p_branch_id AND s.status = 'active'
    UNION ALL
    SELECT 
      'First Aid' as name,
      COUNT(CASE WHEN s.qualifications IS NOT NULL AND 'First Aid' = ANY(s.qualifications) THEN 1 END) as compliant,
      COUNT(CASE WHEN s.qualifications IS NULL OR NOT 'First Aid' = ANY(s.qualifications) THEN 1 END) as noncompliant
    FROM staff s
    WHERE s.branch_id = p_branch_id AND s.status = 'active'
    UNION ALL
    SELECT 
      'Safeguarding' as name,
      COUNT(CASE WHEN s.qualifications IS NOT NULL AND 'Safeguarding' = ANY(s.qualifications) THEN 1 END) as compliant,
      COUNT(CASE WHEN s.qualifications IS NULL OR NOT 'Safeguarding' = ANY(s.qualifications) THEN 1 END) as noncompliant
    FROM staff s
    WHERE s.branch_id = p_branch_id AND s.status = 'active'
  ),
  incident_types AS (
    SELECT 
      cel.category as name,
      COUNT(*) as value
    FROM client_events_logs cel
    WHERE cel.branch_id = p_branch_id
      AND DATE(cel.created_at) BETWEEN start_date AND end_date
      AND cel.category IS NOT NULL
    GROUP BY cel.category
    ORDER BY value DESC
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
      s.first_name || ' ' || s.last_name as carerName,
      s.id::text as carerId,
      COUNT(CASE WHEN ar.status = 'missed' THEN 1 END) as missedCalls,
      COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as lateArrivals,
      COUNT(*) as totalBookings,
      ROUND(
        (COUNT(CASE WHEN ar.status NOT IN ('missed', 'late') THEN 1 END)::numeric / 
         NULLIF(COUNT(*), 0) * 100), 2
      ) as reliabilityPercentage
    FROM staff s
    LEFT JOIN attendance_records ar ON ar.person_id = s.id 
      AND ar.person_type = 'staff'
      AND DATE(ar.created_at) BETWEEN start_date AND end_date
    WHERE s.branch_id = p_branch_id AND s.status = 'active'
    GROUP BY s.id, s.first_name, s.last_name
    ORDER BY reliabilityPercentage DESC
  ),
  medication_administration AS (
    SELECT 
      c.first_name || ' ' || c.last_name as clientName,
      c.id::text as clientId,
      vm.medication_name as medicationName,
      vm.dosage,
      vm.administration_method as administrationMethod,
      vm.administration_time::text as administeredAt,
      CASE 
        WHEN vm.is_administered THEN 'Administered'
        ELSE 'Missed'
      END as status,
      COALESCE(vm.administration_notes, '') as administrationNotes,
      COALESCE(vm.missed_reason, '') as missedReason,
      COALESCE(vm.side_effects_observed, '') as sideEffectsObserved,
      COALESCE(s.first_name || ' ' || s.last_name, 'Unknown') as administeredByName
    FROM visit_medications vm
    JOIN visit_records vr ON vm.visit_record_id = vr.id
    JOIN clients c ON vr.client_id = c.id
    LEFT JOIN staff s ON vm.administered_by = s.id
    WHERE vr.branch_id = p_branch_id
      AND DATE(vm.created_at) BETWEEN start_date AND end_date
    ORDER BY vm.administration_time DESC
    LIMIT 50
  ),
  medication_summary AS (
    SELECT 
      COUNT(*) as totalMedications,
      COUNT(CASE WHEN vm.is_administered THEN 1 END) as administeredCount,
      COUNT(CASE WHEN NOT vm.is_administered THEN 1 END) as missedCount,
      ROUND(
        (COUNT(CASE WHEN vm.is_administered THEN 1 END)::numeric / 
         NULLIF(COUNT(*), 0) * 100), 2
      ) as administrationRate
    FROM visit_medications vm
    JOIN visit_records vr ON vm.visit_record_id = vr.id
    WHERE vr.branch_id = p_branch_id
      AND DATE(vm.created_at) BETWEEN start_date AND end_date
  )
  SELECT json_build_object(
    'trainingCompliance', COALESCE((SELECT json_agg(
      json_build_object(
        'name', name,
        'compliant', compliant,
        'noncompliant', noncompliant
      )
    ) FROM training_compliance), '[]'::json),
    'incidentTypes', COALESCE((SELECT json_agg(
      json_build_object(
        'name', name,
        'value', value
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
        'carerName', carerName,
        'carerId', carerId,
        'missedCalls', missedCalls,
        'lateArrivals', lateArrivals,
        'totalBookings', totalBookings,
        'reliabilityPercentage', reliabilityPercentage
      )
    ) FROM carer_performance), '[]'::json),
    'medicationAdministration', COALESCE((SELECT json_agg(
      json_build_object(
        'clientName', clientName,
        'clientId', clientId,
        'medicationName', medicationName,
        'dosage', dosage,
        'administrationMethod', administrationMethod,
        'administeredAt', administeredAt,
        'status', status,
        'administrationNotes', administrationNotes,
        'missedReason', missedReason,
        'sideEffectsObserved', sideEffectsObserved,
        'administeredByName', administeredByName
      )
    ) FROM medication_administration), '[]'::json),
    'medicationSummary', COALESCE((SELECT json_build_object(
      'totalMedications', totalMedications,
      'administeredCount', administeredCount,
      'missedCount', missedCount,
      'administrationRate', administrationRate
    ) FROM medication_summary), 
    json_build_object(
      'totalMedications', 0,
      'administeredCount', 0,
      'missedCount', 0,
      'administrationRate', 0
    ))
  ) INTO result;
  
  RETURN result;
END;
$function$;