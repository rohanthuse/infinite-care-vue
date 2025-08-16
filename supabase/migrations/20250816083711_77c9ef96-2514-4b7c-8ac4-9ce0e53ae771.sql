-- Create optimized function to fetch tenant data efficiently
CREATE OR REPLACE FUNCTION public.get_optimized_tenant_data()
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  contact_email text,
  subscription_plan text,
  subscription_status text,
  created_at timestamp with time zone,
  activeUsers bigint,
  users jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH organization_branches AS (
    SELECT 
      o.id as org_id,
      o.name,
      o.slug,
      o.contact_email,
      o.subscription_plan,
      o.subscription_status,
      o.created_at,
      array_agg(b.id) as branch_ids
    FROM organizations o
    LEFT JOIN branches b ON o.id = b.organization_id
    GROUP BY o.id, o.name, o.slug, o.contact_email, o.subscription_plan, o.subscription_status, o.created_at
  ),
  user_counts AS (
    SELECT 
      ob.org_id,
      (
        COALESCE(staff_count.count, 0) + 
        COALESCE(client_count.count, 0) + 
        COALESCE(admin_count.count, 0)
      ) as total_users
    FROM organization_branches ob
    LEFT JOIN (
      SELECT 
        b.organization_id,
        COUNT(s.id) as count
      FROM staff s
      JOIN branches b ON s.branch_id = b.id
      WHERE s.status = 'Active'
      GROUP BY b.organization_id
    ) staff_count ON ob.org_id = staff_count.organization_id
    LEFT JOIN (
      SELECT 
        b.organization_id,
        COUNT(c.id) as count
      FROM clients c
      JOIN branches b ON c.branch_id = b.id
      GROUP BY b.organization_id
    ) client_count ON ob.org_id = client_count.organization_id
    LEFT JOIN (
      SELECT 
        b.organization_id,
        COUNT(DISTINCT ab.admin_id) as count
      FROM admin_branches ab
      JOIN branches b ON ab.branch_id = b.id
      GROUP BY b.organization_id
    ) admin_count ON ob.org_id = admin_count.organization_id
  ),
  user_details AS (
    SELECT 
      ob.org_id,
      COALESCE(
        jsonb_agg(
          DISTINCT jsonb_build_object(
            'id', staff_users.id,
            'first_name', staff_users.first_name,
            'last_name', staff_users.last_name,
            'email', staff_users.email,
            'last_login_at', staff_users.last_login_at,
            'status', staff_users.status,
            'user_type', 'staff'
          )
        ) FILTER (WHERE staff_users.id IS NOT NULL), 
        '[]'::jsonb
      ) ||
      COALESCE(
        jsonb_agg(
          DISTINCT jsonb_build_object(
            'id', client_users.id,
            'first_name', client_users.first_name,
            'last_name', client_users.last_name,
            'email', client_users.email,
            'last_login_at', client_users.last_login_at,
            'user_type', 'client'
          )
        ) FILTER (WHERE client_users.id IS NOT NULL),
        '[]'::jsonb
      ) ||
      COALESCE(
        jsonb_agg(
          DISTINCT jsonb_build_object(
            'id', admin_users.id,
            'first_name', admin_users.first_name,
            'last_name', admin_users.last_name,
            'email', admin_users.email,
            'last_login_at', admin_users.last_login_at,
            'user_type', 'admin'
          )
        ) FILTER (WHERE admin_users.id IS NOT NULL),
        '[]'::jsonb
      ) as all_users
    FROM organization_branches ob
    LEFT JOIN branches b ON b.organization_id = ob.org_id
    LEFT JOIN staff staff_users ON staff_users.branch_id = b.id AND staff_users.status = 'Active'
    LEFT JOIN clients client_users ON client_users.branch_id = b.id
    LEFT JOIN admin_branches ab ON ab.branch_id = b.id
    LEFT JOIN staff admin_users ON admin_users.id = ab.admin_id
    GROUP BY ob.org_id
  )
  SELECT 
    ob.org_id,
    ob.name,
    ob.slug,
    ob.contact_email,
    ob.subscription_plan,
    ob.subscription_status,
    ob.created_at,
    COALESCE(uc.total_users, 0),
    COALESCE(ud.all_users, '[]'::jsonb)
  FROM organization_branches ob
  LEFT JOIN user_counts uc ON ob.org_id = uc.org_id
  LEFT JOIN user_details ud ON ob.org_id = ud.org_id
  ORDER BY ob.created_at DESC;
END;
$function$;