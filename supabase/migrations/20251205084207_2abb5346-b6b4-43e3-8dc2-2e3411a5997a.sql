-- Create delete_demo_requests RPC function for batch deletion
CREATE OR REPLACE FUNCTION public.delete_demo_requests(
  p_request_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count int := 0;
BEGIN
  -- Delete the specified demo requests
  DELETE FROM public.demo_requests 
  WHERE id = ANY(p_request_ids);
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true, 
    'deleted_count', v_deleted_count
  );
END;
$$;