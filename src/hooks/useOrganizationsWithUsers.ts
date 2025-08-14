import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface OrganizationWithUsers {
  id: string;
  name: string;
  slug: string;
  contact_email: string | null;
  contact_phone: string | null;
  subscription_status: string;
  subscription_plan: string;
  created_at: string;
  system_users: Array<{
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    role: string;
  }>;
}

export const useOrganizationsWithUsers = () => {
  return useQuery({
    queryKey: ['organizations-with-users'],
    queryFn: async () => {
      // First fetch organizations
      const { data: organizations, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (orgError) throw orgError;

      // Then fetch user associations for each organization
      const organizationsWithUsers: OrganizationWithUsers[] = [];

      for (const org of organizations || []) {
        const { data: userAssocs, error: userError } = await supabase
          .from('system_user_organizations')
          .select(`
            system_users!inner (
              id,
              email,
              first_name,
              last_name,
              is_active,
              system_user_roles!inner (
                role
              )
            )
          `)
          .eq('organization_id', org.id);

        if (userError) {
          console.error('Error fetching users for org:', org.id, userError);
          organizationsWithUsers.push({
            ...org,
            system_users: [],
          });
          continue;
        }

        const systemUsers = (userAssocs || []).map((assoc: any) => ({
          id: assoc.system_users.id,
          email: assoc.system_users.email,
          first_name: assoc.system_users.first_name,
          last_name: assoc.system_users.last_name,
          is_active: assoc.system_users.is_active,
          role: assoc.system_users.system_user_roles?.[0]?.role || 'support_admin',
        }));

        organizationsWithUsers.push({
          ...org,
          system_users: systemUsers,
        });
      }

      return organizationsWithUsers;
    },
  });
};