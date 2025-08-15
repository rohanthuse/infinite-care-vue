
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from '@/contexts/TenantContext';
import { validateBranchInOrganization } from './useTenantAware';

export const useBranchStaffAndClients = (branchId: string) => {
  const { organization } = useTenant();

  const { data: staff = [], isLoading: isLoadingStaff } = useQuery({
    queryKey: ['branch-staff', branchId, organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        throw new Error('Organization context required');
      }

      // Validate branch belongs to organization
      const isValidBranch = await validateBranchInOrganization(branchId, organization.id);
      if (!isValidBranch) {
        throw new Error('Branch does not belong to current organization');
      }

      const { data, error } = await supabase
        .from('staff')
        .select('id, first_name, last_name, email, specialization')
        .eq('branch_id', branchId)
        .eq('status', 'Active');

      if (error) throw error;
      return data || [];
    },
    enabled: Boolean(branchId) && Boolean(organization?.id),
  });

  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['branch-clients', branchId, organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        throw new Error('Organization context required');
      }

      // Validate branch belongs to organization
      const isValidBranch = await validateBranchInOrganization(branchId, organization.id);
      if (!isValidBranch) {
        throw new Error('Branch does not belong to current organization');
      }

      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email')
        .eq('branch_id', branchId);

      if (error) throw error;
      return data || [];
    },
    enabled: Boolean(branchId) && Boolean(organization?.id),
  });

  return {
    staff,
    clients,
    isLoading: isLoadingStaff || isLoadingClients,
  };
};
