
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from '@/contexts/TenantContext';
import { validateBranchInOrganization } from './useTenantAware';

interface UseBranchStaffAndClientsOptions {
  includeInactiveClients?: boolean; // When true, includes inactive clients for historical data visibility
}

export const useBranchStaffAndClients = (
  branchId: string, 
  options: UseBranchStaffAndClientsOptions = {}
) => {
  const { organization } = useTenant();
  const { includeInactiveClients = false } = options;

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
        .select('id, auth_user_id, first_name, last_name, email, specialization, status')
        .eq('branch_id', branchId)
        .order('status', { ascending: false })
        .order('first_name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: Boolean(branchId) && Boolean(organization?.id),
  });

  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['branch-clients', branchId, organization?.id, includeInactiveClients],
    queryFn: async () => {
      if (!organization?.id) {
        throw new Error('Organization context required');
      }

      // Validate branch belongs to organization
      const isValidBranch = await validateBranchInOrganization(branchId, organization.id);
      if (!isValidBranch) {
        throw new Error('Branch does not belong to current organization');
      }

      let query = supabase
        .from('clients')
        .select('id, first_name, last_name, email, status')
        .eq('branch_id', branchId);

      // Only filter by Active status if not including inactive clients
      // This allows historical data views to show all clients
      if (!includeInactiveClients) {
        query = query.eq('status', 'Active');
      }

      const { data, error } = await query;

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
