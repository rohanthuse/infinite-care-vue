-- Drop the existing repair function
DROP FUNCTION IF EXISTS public.repair_system_user_organization_sync();

-- Create enhanced repair function that handles BOTH directions of sync
CREATE OR REPLACE FUNCTION public.repair_system_user_organization_sync()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_repaired_count INTEGER := 0;
  v_direction_1_count INTEGER := 0;
  v_direction_2_count INTEGER := 0;
  v_result jsonb;
BEGIN
  -- Direction 1: Sync organization_members → system_user_organizations
  -- (existing logic - users in org_members but missing in system_user_orgs)
  WITH missing_in_suo AS (
    SELECT 
      om.user_id,
      om.organization_id,
      om.role,
      su.id as system_user_id
    FROM organization_members om
    JOIN system_users su ON om.user_id = su.auth_user_id
    LEFT JOIN system_user_organizations suo 
      ON su.id = suo.system_user_id 
      AND om.organization_id = suo.organization_id
    WHERE suo.system_user_id IS NULL
      AND om.status = 'active'
  ),
  inserted_suo AS (
    INSERT INTO system_user_organizations (system_user_id, organization_id, role)
    SELECT system_user_id, organization_id, role
    FROM missing_in_suo
    ON CONFLICT (system_user_id, organization_id) 
    DO UPDATE SET 
      role = EXCLUDED.role,
      updated_at = now()
    RETURNING system_user_id, organization_id
  )
  SELECT COUNT(*) INTO v_direction_1_count FROM inserted_suo;

  -- Direction 2: Sync system_user_organizations → organization_members
  -- (NEW logic - users in system_user_orgs but missing in org_members)
  WITH missing_in_om AS (
    SELECT 
      su.auth_user_id,
      suo.organization_id,
      suo.role,
      su.id as system_user_id
    FROM system_user_organizations suo
    JOIN system_users su ON suo.system_user_id = su.id
    LEFT JOIN organization_members om 
      ON su.auth_user_id = om.user_id 
      AND suo.organization_id = om.organization_id
    WHERE om.user_id IS NULL
      AND su.auth_user_id IS NOT NULL
  ),
  inserted_om AS (
    INSERT INTO organization_members (user_id, organization_id, role, status, joined_at)
    SELECT auth_user_id, organization_id, role, 'active', now()
    FROM missing_in_om
    ON CONFLICT (user_id, organization_id) 
    DO UPDATE SET 
      role = EXCLUDED.role,
      status = 'active',
      updated_at = now()
    RETURNING user_id, organization_id
  )
  SELECT COUNT(*) INTO v_direction_2_count FROM inserted_om;

  -- Calculate total repaired count
  v_repaired_count := v_direction_1_count + v_direction_2_count;

  -- Log to audit trail
  IF v_repaired_count > 0 THEN
    INSERT INTO system_user_organization_audit (
      system_user_id,
      organization_id,
      action,
      performed_by,
      details
    )
    SELECT 
      su.id,
      suo.organization_id,
      'auto_repair_sync',
      auth.uid(),
      jsonb_build_object(
        'direction_1_repairs', v_direction_1_count,
        'direction_2_repairs', v_direction_2_count,
        'total_repairs', v_repaired_count,
        'timestamp', now()
      )
    FROM system_user_organizations suo
    JOIN system_users su ON suo.system_user_id = su.id
    LIMIT 1;
  END IF;

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'repaired_count', v_repaired_count,
    'direction_1_count', v_direction_1_count,
    'direction_2_count', v_direction_2_count,
    'timestamp', now()
  );

  RETURN v_result;
END;
$$;