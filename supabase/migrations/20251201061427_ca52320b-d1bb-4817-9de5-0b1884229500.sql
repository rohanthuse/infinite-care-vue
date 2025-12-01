-- Fix the get_admin_user_details function type mismatch
CREATE OR REPLACE FUNCTION public.get_admin_user_details(user_ids uuid[])
RETURNS TABLE (
  id uuid,
  email text,
  first_name text,
  last_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email::text,
    COALESCE(au.raw_user_meta_data->>'first_name', '')::text as first_name,
    COALESCE(au.raw_user_meta_data->>'last_name', '')::text as last_name
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$;