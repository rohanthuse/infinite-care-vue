-- Drop and recreate delete_organization_cascade to fix audit logging issue
DROP FUNCTION IF EXISTS delete_organization_cascade(UUID, UUID);

CREATE OR REPLACE FUNCTION delete_organization_cascade(
  p_organization_id UUID,
  p_system_user_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '300s'
AS $$
DECLARE
  v_org_name TEXT;
  v_deleted_count INTEGER := 0;
BEGIN
  -- Get organization name for logging
  SELECT name INTO v_org_name FROM organizations WHERE id = p_organization_id;
  
  IF v_org_name IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Organization not found'
    );
  END IF;

  RAISE NOTICE 'Starting cascade delete for organization: % (ID: %)', v_org_name, p_organization_id;

  -- Delete in correct dependency order to avoid FK violations
  
  -- 1. Communication-related tables
  DELETE FROM communication_messages WHERE organization_id = p_organization_id;
  DELETE FROM communication_participants WHERE organization_id = p_organization_id;
  DELETE FROM communication_groups WHERE organization_id = p_organization_id;
  DELETE FROM communication_types WHERE organization_id = p_organization_id;
  
  -- 2. Form-related tables
  DELETE FROM form_submissions WHERE organization_id = p_organization_id;
  DELETE FROM form_field_options WHERE organization_id = p_organization_id;
  DELETE FROM form_fields WHERE organization_id = p_organization_id;
  DELETE FROM forms WHERE organization_id = p_organization_id;
  
  -- 3. Client-related detailed tables
  DELETE FROM client_documents WHERE client_id IN (SELECT id FROM clients WHERE organization_id = p_organization_id);
  DELETE FROM client_dietary_requirements WHERE client_id IN (SELECT id FROM clients WHERE organization_id = p_organization_id);
  DELETE FROM client_child_info WHERE client_id IN (SELECT id FROM clients WHERE organization_id = p_organization_id);
  DELETE FROM client_behavior_support WHERE client_id IN (SELECT id FROM clients WHERE organization_id = p_organization_id);
  DELETE FROM client_medical_history WHERE client_id IN (SELECT id FROM clients WHERE organization_id = p_organization_id);
  DELETE FROM client_mobility_equipment WHERE client_id IN (SELECT id FROM clients WHERE organization_id = p_organization_id);
  DELETE FROM client_next_of_kin WHERE client_id IN (SELECT id FROM clients WHERE organization_id = p_organization_id);
  
  -- 4. Care plan related tables (depends on clients)
  DELETE FROM care_plan_forms WHERE care_plan_id IN (SELECT id FROM client_care_plans WHERE client_id IN (SELECT id FROM clients WHERE organization_id = p_organization_id));
  DELETE FROM care_plan_status_history WHERE care_plan_id IN (SELECT id FROM client_care_plans WHERE client_id IN (SELECT id FROM clients WHERE organization_id = p_organization_id));
  DELETE FROM care_plan_wizard_steps WHERE care_plan_id IN (SELECT id FROM client_care_plans WHERE client_id IN (SELECT id FROM clients WHERE organization_id = p_organization_id));
  DELETE FROM client_care_plan_approvals WHERE care_plan_id IN (SELECT id FROM client_care_plans WHERE client_id IN (SELECT id FROM clients WHERE organization_id = p_organization_id));
  DELETE FROM client_care_plan_goals WHERE care_plan_id IN (SELECT id FROM client_care_plans WHERE client_id IN (SELECT id FROM clients WHERE organization_id = p_organization_id));
  DELETE FROM client_activities WHERE care_plan_id IN (SELECT id FROM client_care_plans WHERE client_id IN (SELECT id FROM clients WHERE organization_id = p_organization_id));
  DELETE FROM client_care_plans WHERE client_id IN (SELECT id FROM clients WHERE organization_id = p_organization_id);
  
  -- 5. Client assessments and appointments
  DELETE FROM client_assessments WHERE client_id IN (SELECT id FROM clients WHERE organization_id = p_organization_id);
  DELETE FROM client_appointments WHERE client_id IN (SELECT id FROM clients WHERE organization_id = p_organization_id);
  
  -- 6. Medication-related tables
  DELETE FROM medication_stock WHERE organization_id = p_organization_id;
  DELETE FROM medication_records WHERE organization_id = p_organization_id;
  DELETE FROM medication WHERE organization_id = p_organization_id;
  
  -- 7. Booking and service-related tables
  DELETE FROM booking_unavailability_requests WHERE organization_id = p_organization_id;
  DELETE FROM bookings WHERE organization_id = p_organization_id;
  DELETE FROM services WHERE organization_id = p_organization_id;
  
  -- 8. Financial tables
  DELETE FROM client_billing WHERE organization_id = p_organization_id;
  DELETE FROM client_accounting_settings WHERE organization_id = p_organization_id;
  DELETE FROM payslips WHERE organization_id = p_organization_id;
  DELETE FROM staff_pay_rates WHERE organization_id = p_organization_id;
  
  -- 9. Staff-related tables
  DELETE FROM staff_availability WHERE staff_id IN (SELECT id FROM staff WHERE organization_id = p_organization_id);
  DELETE FROM staff_documents WHERE staff_id IN (SELECT id FROM staff WHERE organization_id = p_organization_id);
  DELETE FROM staff_training WHERE staff_id IN (SELECT id FROM staff WHERE organization_id = p_organization_id);
  DELETE FROM staff WHERE organization_id = p_organization_id;
  
  -- 10. Client accounting and main clients
  DELETE FROM clients WHERE organization_id = p_organization_id;
  
  -- 11. Other organization-scoped tables
  DELETE FROM bank_holidays WHERE organization_id = p_organization_id;
  DELETE FROM body_map_points WHERE organization_id = p_organization_id;
  DELETE FROM notification_preferences WHERE organization_id = p_organization_id;
  DELETE FROM reports WHERE organization_id = p_organization_id;
  DELETE FROM review_schedules WHERE organization_id = p_organization_id;
  DELETE FROM third_party_organizations WHERE organization_id = p_organization_id;
  DELETE FROM workflow_automations WHERE organization_id = p_organization_id;
  DELETE FROM workflow_triggers WHERE organization_id = p_organization_id;
  
  -- 12. Branch-related tables (depends on organization)
  DELETE FROM admin_permissions WHERE branch_id IN (SELECT id FROM branches WHERE organization_id = p_organization_id);
  DELETE FROM admin_branches WHERE branch_id IN (SELECT id FROM branches WHERE organization_id = p_organization_id);
  DELETE FROM annual_leave_calendar WHERE branch_id IN (SELECT id FROM branches WHERE organization_id = p_organization_id);
  DELETE FROM attendance_records WHERE branch_id IN (SELECT id FROM branches WHERE organization_id = p_organization_id);
  DELETE FROM branches WHERE organization_id = p_organization_id;
  
  -- 13. Organization members and roles
  DELETE FROM organization_members WHERE organization_id = p_organization_id;
  
  -- 14. Finally delete the organization itself
  DELETE FROM organizations WHERE id = p_organization_id;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Cascade delete completed for organization: %', v_org_name;

  RETURN jsonb_build_object(
    'success', true,
    'organization_name', v_org_name,
    'deleted_count', v_deleted_count
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error during cascade delete: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;