
-- Function to link client to auth user and fix missing auth_user_id
CREATE OR REPLACE FUNCTION public.link_client_to_auth_user(
  p_client_id uuid,
  p_auth_user_id uuid,
  p_admin_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_record RECORD;
  result json;
BEGIN
  -- Check if the admin has permission (must be super_admin or branch_admin)
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_admin_id AND role IN ('super_admin', 'branch_admin')
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;
  
  -- Get client record
  SELECT * INTO client_record FROM public.clients WHERE id = p_client_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Client not found');
  END IF;
  
  -- Update client record with auth_user_id link
  UPDATE public.clients 
  SET 
    auth_user_id = p_auth_user_id,
    updated_at = now()
  WHERE id = p_client_id;
  
  -- Ensure client role exists
  INSERT INTO public.user_roles (user_id, role) 
  VALUES (p_auth_user_id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Client linked to auth user successfully',
    'auth_user_id', p_auth_user_id,
    'client_linked', true
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Failed to link client: ' || SQLERRM);
END;
$$;
