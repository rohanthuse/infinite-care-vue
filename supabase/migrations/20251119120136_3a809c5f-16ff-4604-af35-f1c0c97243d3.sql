-- Create function to safely delete an organization and all its related data
CREATE OR REPLACE FUNCTION public.delete_organization_cascade(
  p_organization_id uuid,
  p_system_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_counts json;
  v_org_name text;
  v_count int;
BEGIN
  -- Get organization name for audit log
  SELECT name INTO v_org_name FROM organizations WHERE id = p_organization_id;
  
  IF v_org_name IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Organization not found'
    );
  END IF;

  -- Start deletion in correct order (deepest dependencies first)
  
  -- Level 5: Invoice line items
  DELETE FROM invoice_line_items WHERE invoice_id IN (
    SELECT id FROM client_billing WHERE organization_id = p_organization_id
  );
  
  -- Level 4: Booking-related records
  DELETE FROM visit_records WHERE booking_id IN (
    SELECT id FROM bookings WHERE organization_id = p_organization_id
  );
  
  DELETE FROM travel_records WHERE booking_id IN (
    SELECT id FROM bookings WHERE organization_id = p_organization_id
  );
  
  DELETE FROM extra_time_records WHERE booking_id IN (
    SELECT id FROM bookings WHERE organization_id = p_organization_id
  );
  
  DELETE FROM booking_unavailability_requests WHERE organization_id = p_organization_id;
  
  -- Level 3: Client-related records
  DELETE FROM client_service_reports WHERE organization_id = p_organization_id;
  DELETE FROM client_billing WHERE organization_id = p_organization_id;
  
  -- Level 2: Core operational data
  DELETE FROM bookings WHERE organization_id = p_organization_id;
  DELETE FROM expenses WHERE organization_id = p_organization_id;
  DELETE FROM reviews WHERE organization_id = p_organization_id;
  DELETE FROM notifications WHERE organization_id = p_organization_id;
  DELETE FROM bank_holidays WHERE organization_id = p_organization_id;
  DELETE FROM body_map_points WHERE organization_id = p_organization_id;
  DELETE FROM report_types WHERE organization_id = p_organization_id;
  
  -- Level 1: Organization structure and membership
  DELETE FROM branches WHERE organization_id = p_organization_id OR tenant_id = p_organization_id;
  DELETE FROM system_user_organizations WHERE organization_id = p_organization_id;
  DELETE FROM organization_members WHERE organization_id = p_organization_id;
  
  -- Level 0: Organization itself
  DELETE FROM organizations WHERE id = p_organization_id;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  IF v_count = 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to delete organization'
    );
  END IF;
  
  -- Create audit log entry
  INSERT INTO system_audit_logs (
    system_user_id,
    action,
    entity_type,
    entity_id,
    details,
    ip_address
  ) VALUES (
    p_system_user_id,
    'delete_organization',
    'organization',
    p_organization_id,
    json_build_object(
      'organization_name', v_org_name,
      'deleted_at', now()
    ),
    NULL
  );
  
  RETURN json_build_object(
    'success', true,
    'organization_name', v_org_name,
    'deleted_at', now()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;