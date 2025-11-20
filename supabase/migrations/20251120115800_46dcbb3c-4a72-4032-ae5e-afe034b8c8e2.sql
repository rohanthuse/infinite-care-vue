-- Comprehensive fix for delete_organization_cascade to include ALL organization-scoped tables
-- This replaces the previous function with a complete implementation that handles all dependencies

CREATE OR REPLACE FUNCTION public.delete_organization_cascade(
  p_organization_id uuid, 
  p_system_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout TO '300000' -- 5 minutes for large datasets
AS $function$
DECLARE
  v_org_name text;
  v_count int;
  v_total_deleted int := 0;
BEGIN
  -- Get organization name for audit log
  SELECT name INTO v_org_name FROM organizations WHERE id = p_organization_id;
  
  IF v_org_name IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Organization not found');
  END IF;

  -- Log start
  RAISE NOTICE 'Starting cascade delete for organization: % (ID: %)', v_org_name, p_organization_id;

  -- LEVEL 7: Invoice line items (depends on client_billing)
  DELETE FROM invoice_line_items 
  WHERE invoice_id IN (SELECT id FROM client_billing WHERE organization_id = p_organization_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % invoice_line_items', v_count;
  
  -- LEVEL 6: Booking-related records (depend on bookings)
  DELETE FROM visit_records 
  WHERE booking_id IN (SELECT id FROM bookings WHERE organization_id = p_organization_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % visit_records', v_count;
  
  DELETE FROM travel_records 
  WHERE booking_id IN (SELECT id FROM bookings WHERE organization_id = p_organization_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % travel_records', v_count;
  
  DELETE FROM extra_time_records 
  WHERE booking_id IN (SELECT id FROM bookings WHERE organization_id = p_organization_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % extra_time_records', v_count;
  
  DELETE FROM booking_unavailability_requests WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % booking_unavailability_requests', v_count;
  
  -- LEVEL 5: Client-related dependent records
  DELETE FROM client_vaccinations WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % client_vaccinations', v_count;
  
  DELETE FROM client_private_accounting WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % client_private_accounting', v_count;
  
  DELETE FROM client_accounting_settings WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % client_accounting_settings', v_count;
  
  DELETE FROM client_service_reports WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % client_service_reports', v_count;
  
  DELETE FROM client_billing WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % client_billing', v_count;
  
  DELETE FROM client_rate_schedules WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % client_rate_schedules', v_count;
  
  DELETE FROM client_groups WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % client_groups', v_count;
  
  -- Staff-related dependent records
  DELETE FROM staff_working_hours WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % staff_working_hours', v_count;
  
  DELETE FROM staff_rate_schedules WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % staff_rate_schedules', v_count;
  
  -- Message-related records
  DELETE FROM scheduled_messages WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % scheduled_messages', v_count;
  
  DELETE FROM message_threads WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % message_threads', v_count;
  
  -- Invoice batches
  DELETE FROM invoice_generation_batches WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % invoice_generation_batches', v_count;
  
  -- LEVEL 4: Core entities (clients, staff, services, documents, forms)
  DELETE FROM clients WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % clients', v_count;
  
  DELETE FROM staff WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % staff', v_count;
  
  DELETE FROM services WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % services', v_count;
  
  DELETE FROM documents WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % documents', v_count;
  
  DELETE FROM forms WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % forms', v_count;
  
  -- LEVEL 3: Configuration & lookup tables
  DELETE FROM communication_types WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % communication_types', v_count;
  
  DELETE FROM expense_types WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % expense_types', v_count;
  
  DELETE FROM work_types WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % work_types', v_count;
  
  DELETE FROM file_categories WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % file_categories', v_count;
  
  DELETE FROM skills WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % skills', v_count;
  
  DELETE FROM hobbies WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % hobbies', v_count;
  
  DELETE FROM medical_categories WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % medical_categories', v_count;
  
  DELETE FROM medical_conditions WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % medical_conditions', v_count;
  
  DELETE FROM travel_rates WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % travel_rates', v_count;
  
  DELETE FROM report_types WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % report_types', v_count;
  
  -- LEVEL 2: Operational data
  DELETE FROM bookings WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % bookings', v_count;
  
  DELETE FROM expenses WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % expenses', v_count;
  
  DELETE FROM reviews WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % reviews', v_count;
  
  DELETE FROM notifications WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % notifications', v_count;
  
  DELETE FROM bank_holidays WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % bank_holidays', v_count;
  
  DELETE FROM body_map_points WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % body_map_points', v_count;
  
  -- LEVEL 1: Organization structure and membership
  DELETE FROM branches WHERE organization_id = p_organization_id OR tenant_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % branches', v_count;
  
  DELETE FROM system_user_organizations WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % system_user_organizations', v_count;
  
  DELETE FROM organization_members WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % organization_members', v_count;
  
  DELETE FROM app_admin_organizations WHERE organization_id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted % app_admin_organizations', v_count;
  
  -- LEVEL 0: Organization itself
  DELETE FROM organizations WHERE id = p_organization_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  IF v_count = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Failed to delete organization');
  END IF;
  
  v_total_deleted := v_total_deleted + v_count;
  RAISE NOTICE 'Deleted organization. Total records deleted: %', v_total_deleted;
  
  -- Create audit log entry
  INSERT INTO system_audit_logs (
    system_user_id, action, entity_type, entity_id, details, ip_address
  ) VALUES (
    p_system_user_id, 'delete_organization', 'organization', p_organization_id,
    json_build_object(
      'organization_name', v_org_name,
      'total_records_deleted', v_total_deleted,
      'deleted_at', now()
    ),
    NULL
  );
  
  RETURN json_build_object(
    'success', true,
    'organization_name', v_org_name,
    'total_records_deleted', v_total_deleted,
    'deleted_at', now()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error during cascade delete: %', SQLERRM;
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- Add helpful comment
COMMENT ON FUNCTION delete_organization_cascade(p_organization_id uuid, p_system_user_id uuid) 
IS 'Comprehensive cascade delete for organizations. Deletes all related data across 40+ tables in correct dependency order. Extended timeout (5 minutes) for large datasets.';