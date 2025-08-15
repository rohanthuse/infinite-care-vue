import { useTenantAwareQuery, createTenantQuery } from './useTenantAware';
import type { Branch } from '@/pages/Branch';

export const useBranchNavigation = () => {
  return useTenantAwareQuery(
    ['branches-navigation'],
    async (organizationId: string) => {
      const { data, error } = await createTenantQuery(organizationId)
        .branches()
        .eq('status', 'Active')
        .order('name');
      
      if (error) throw error;
      return data as Branch[];
    }
  );
};