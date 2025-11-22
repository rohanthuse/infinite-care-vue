import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OrganizationForAssignment {
  id: string;
  name: string;
  slug: string;
  subscription_plan: string;
  has_super_admin: boolean; // Legacy field - always false now
  user_count: number;
}

const fetchOrganizationsForAssignment = async (): Promise<OrganizationForAssignment[]> => {
  // Fetch all organizations with subscription plan info
  const { data: organizations, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, slug, subscription_plan')
    .order('name', { ascending: true });

  if (orgError) throw orgError;

  // For each organization, check if they have a Super Admin
  const orgsWithUserInfo = await Promise.all(
    (organizations || []).map(async (org) => {
      const { data: userAssocs, error: userError } = await supabase
        .from('system_user_organizations')
        .select('role, system_user_id')
        .eq('organization_id', org.id);

      if (userError) {
        console.error('Error fetching users for org:', org.id, userError);
        return {
          ...org,
          subscription_plan: org.subscription_plan || 'basic',
          has_super_admin: false,
          user_count: 0,
        };
      }

      return {
        ...org,
        subscription_plan: org.subscription_plan || 'basic',
        has_super_admin: false, // Not checking for super_admin anymore
        user_count: userAssocs?.length || 0,
      };
    })
  );

  // Return all organizations (allow multiple admins per org)
  return orgsWithUserInfo;
};

export const useOrganizationsForUserAssignment = () => {
  return useQuery({
    queryKey: ['organizations', 'for-user-assignment'],
    queryFn: fetchOrganizationsForAssignment,
    staleTime: 0, // Always refetch to ensure fresh data
  });
};
