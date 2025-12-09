import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

export interface OrganizationBranch {
  id: string;
  name: string;
  status: string;
}

export const useBranchesForOrganization = (excludeBranchId?: string) => {
  const { organization } = useTenant();

  return useQuery({
    queryKey: ['organization-branches', organization?.id, excludeBranchId],
    queryFn: async (): Promise<OrganizationBranch[]> => {
      if (!organization?.id) {
        throw new Error('No organization found');
      }

      let query = supabase
        .from('branches')
        .select('id, name, status')
        .eq('organization_id', organization.id)
        .eq('status', 'Active');

      if (excludeBranchId) {
        query = query.neq('id', excludeBranchId);
      }

      const { data, error } = await query.order('name');
      
      if (error) {
        console.error('[useBranchesForOrganization] Error:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!organization?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
