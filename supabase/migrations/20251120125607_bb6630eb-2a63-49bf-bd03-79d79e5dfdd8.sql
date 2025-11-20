-- Fix delete_organization_cascade to remove references to non-existent tables
-- and restore a safe, comprehensive cascade delete for organizations

-- Drop any existing version first (both schema-qualified and unqualified)
DROP FUNCTION IF EXISTS public.delete_organization_cascade(uuid, uuid);
DROP FUNCTION IF EXISTS delete_organization_cascade(uuid, uuid);

CREATE OR REPLACE FUNCTION public.delete_organization_cascade(
  p_organization_id uuid,
  p_system_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout TO '300000' -- 5 minutes for large datasets
AS $$
DECLARE
  v_org_name       text;
  v_count          int;
  v_total_deleted  int := 0;
BEGIN
  -- Get organization name for logging
  SELECT name INTO v_org_name FROM organizations WHERE id = p_organization_id;

  IF v_org_name IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Organization not found');
  END IF;

  RAISE NOTICE 'Starting cascade delete for organization: % (ID: %)', v_org_name, p_organization_id;

  --------------------------------------------------------------------
  -- LEVEL 1: Invoice line items (depends on client_billing)
  --------------------------------------------------------------------
  DELETE FROM invoice_line_items 
  WHERE invoice_id IN (
    SELECT id FROM client_billing WHERE organization_id = p_organization_id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  --------------------------------------------------------------------
  -- LEVEL 2: Booking-related records (depend on bookings)
  --------------------------------------------------------------------
  DELETE FROM visit_records 
  WHERE booking_id IN (SELECT id FROM bookings WHERE organization_id = p_organization_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM travel_records 
  WHERE booking_id IN (SELECT id FROM bookings WHERE organization_id = p_organization_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM extra_time_records 
  WHERE booking_id IN (SELECT id FROM bookings WHERE organization_id = p_organization_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM booking_unavailability_requests 
  WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  --------------------------------------------------------------------
  -- LEVEL 3: Client-related detailed records (depend on clients)
  --------------------------------------------------------------------
  DELETE FROM client_documents 
  WHERE client_id IN (SELECT id FROM clients WHERE organization_id = p_organization_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM client_dietary_requirements 
  WHERE client_id IN (SELECT id FROM clients WHERE organization_id = p_organization_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM client_child_info 
  WHERE client_id IN (SELECT id FROM clients WHERE organization_id = p_organization_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM client_behavior_support 
  WHERE client_id IN (SELECT id FROM clients WHERE organization_id = p_organization_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  --------------------------------------------------------------------
  -- LEVEL 4: Care plan related tables (depend on client_care_plans -> clients)
  --------------------------------------------------------------------
  DELETE FROM care_plan_forms 
  WHERE care_plan_id IN (
    SELECT id FROM client_care_plans 
    WHERE client_id IN (SELECT id FROM clients WHERE organization_id = p_organization_id)
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM care_plan_status_history 
  WHERE care_plan_id IN (
    SELECT id FROM client_care_plans 
    WHERE client_id IN (SELECT id FROM clients WHERE organization_id = p_organization_id)
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM care_plan_wizard_steps 
  WHERE care_plan_id IN (
    SELECT id FROM client_care_plans 
    WHERE client_id IN (SELECT id FROM clients WHERE organization_id = p_organization_id)
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM client_care_plan_approvals 
  WHERE care_plan_id IN (
    SELECT id FROM client_care_plans 
    WHERE client_id IN (SELECT id FROM clients WHERE organization_id = p_organization_id)
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM client_care_plan_goals 
  WHERE care_plan_id IN (
    SELECT id FROM client_care_plans 
    WHERE client_id IN (SELECT id FROM clients WHERE organization_id = p_organization_id)
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM client_activities 
  WHERE care_plan_id IN (
    SELECT id FROM client_care_plans 
    WHERE client_id IN (SELECT id FROM clients WHERE organization_id = p_organization_id)
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM client_care_plans 
  WHERE client_id IN (SELECT id FROM clients WHERE organization_id = p_organization_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  --------------------------------------------------------------------
  -- LEVEL 5: Client assessments and appointments
  --------------------------------------------------------------------
  DELETE FROM client_assessments 
  WHERE client_id IN (SELECT id FROM clients WHERE organization_id = p_organization_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM client_appointments 
  WHERE client_id IN (SELECT id FROM clients WHERE organization_id = p_organization_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  --------------------------------------------------------------------
  -- LEVEL 6: Client accounting and grouping
  --------------------------------------------------------------------
  DELETE FROM client_vaccinations WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM client_private_accounting WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM client_accounting_settings WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM client_service_reports WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM client_billing WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM client_rate_schedules WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM client_groups WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  --------------------------------------------------------------------
  -- LEVEL 7: Staff-related records
  --------------------------------------------------------------------
  DELETE FROM staff_working_hours WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM staff_rate_schedules WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  --------------------------------------------------------------------
  -- LEVEL 8: Messaging / invoices batches
  --------------------------------------------------------------------
  DELETE FROM scheduled_messages WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM message_threads WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM invoice_generation_batches WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  --------------------------------------------------------------------
  -- LEVEL 9: Core entities
  --------------------------------------------------------------------
  DELETE FROM bookings WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM clients WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM staff WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM services WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM documents WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM forms WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  --------------------------------------------------------------------
  -- LEVEL 10: Configuration & lookup tables
  --------------------------------------------------------------------
  DELETE FROM communication_types WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM expense_types WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM work_types WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM file_categories WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM skills WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM hobbies WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM medical_categories WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM medical_conditions WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM travel_rates WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  --------------------------------------------------------------------
  -- LEVEL 11: Operational / other org-scoped tables
  --------------------------------------------------------------------
  DELETE FROM expenses WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM reviews WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM notifications WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM bank_holidays WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM body_map_points WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  --------------------------------------------------------------------
  -- LEVEL 12: Branches and memberships
  --------------------------------------------------------------------
  DELETE FROM branches WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM system_user_organizations WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM organization_members WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  DELETE FROM app_admin_organizations WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  --------------------------------------------------------------------
  -- LEVEL 13: Finally delete the organization record itself
  --------------------------------------------------------------------
  DELETE FROM organizations WHERE id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;

  IF v_count = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Failed to delete organization');
  END IF;

  RAISE NOTICE 'Cascade delete completed for organization: % (ID: %). Total records deleted: %', 
    v_org_name, p_organization_id, v_total_deleted;

  RETURN json_build_object(
    'success', true,
    'organization_name', v_org_name,
    'total_records_deleted', v_total_deleted,
    'deleted_at', now()
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error during cascade delete for organization % (ID: %): %', 
      v_org_name, p_organization_id, SQLERRM;
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.delete_organization_cascade(p_organization_id uuid, p_system_user_id uuid) 
IS 'Comprehensive cascade delete for organizations. Deletes all related data in dependency order with extended timeout.';