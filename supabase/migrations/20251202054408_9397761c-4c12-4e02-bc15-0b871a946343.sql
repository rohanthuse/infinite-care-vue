-- =====================================================
-- Subscription Expiry Processing Function
-- =====================================================
-- This function automatically sets organizations to 'inactive' 
-- when their subscription has expired (subscription_expires_at < NOW())

CREATE OR REPLACE FUNCTION process_subscription_expiry()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expired_count INTEGER := 0;
  v_expiring_soon_count INTEGER := 0;
  v_result JSON;
BEGIN
  -- Auto-deactivate expired organizations
  UPDATE organizations
  SET subscription_status = 'inactive',
      updated_at = NOW()
  WHERE subscription_expires_at < NOW()
    AND subscription_status = 'active';
  
  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  
  -- Count organizations expiring within 7 days (for notifications)
  SELECT COUNT(*) INTO v_expiring_soon_count
  FROM organizations
  WHERE subscription_expires_at BETWEEN NOW() AND (NOW() + INTERVAL '7 days')
    AND subscription_status = 'active';
  
  -- Build result JSON
  v_result := json_build_object(
    'expired_count', v_expired_count,
    'expiring_soon_count', v_expiring_soon_count,
    'processed_at', NOW()
  );
  
  -- Log the processing to system audit logs if table exists
  BEGIN
    INSERT INTO system_audit_logs (
      action_type,
      entity_type,
      entity_id,
      details,
      created_at
    ) VALUES (
      'subscription_expiry_processed',
      'system',
      'cron-job',
      json_build_object(
        'expired_organizations', v_expired_count,
        'expiring_soon', v_expiring_soon_count
      ),
      NOW()
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- If audit log table doesn't exist or fails, continue
      NULL;
  END;
  
  RETURN v_result;
END;
$$;