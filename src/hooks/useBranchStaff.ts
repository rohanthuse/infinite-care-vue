
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { validateBranchInOrganization } from './useTenantAware';

export interface BranchStaff {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  status: string;
  specialization?: string;
  address?: string;
  postcode?: string;
}

const fetchBranchStaff = async (branchId: string, organizationId: string): Promise<BranchStaff[]> => {
  // Validate branch belongs to organization
  const isValidBranch = await validateBranchInOrganization(branchId, organizationId);
  if (!isValidBranch) {
    throw new Error('Branch does not belong to current organization');
  }

  const { data, error } = await supabase
    .from('staff')
    .select('id, first_name, last_name, email, status, specialization, address, postcode')
    .eq('branch_id', branchId)
    .eq('status', 'Active')
    .order('first_name');

  if (error) {
    console.error('Error fetching branch staff:', error);
    throw error;
  }

  return data || [];
};

export const useBranchStaff = (branchId: string) => {
  const { organization } = useTenant();
  
  return useQuery({
    queryKey: ['branch-staff', branchId, organization?.id],
    queryFn: () => {
      if (!organization?.id) {
        throw new Error('Organization context required');
      }
      return fetchBranchStaff(branchId, organization.id);
    },
    enabled: Boolean(branchId) && Boolean(organization?.id),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
};
