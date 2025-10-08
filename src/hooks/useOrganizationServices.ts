import { useTenantAwareQuery, createTenantQuery } from './useTenantAware';

export interface OrganizationService {
  id: string;
  title: string;
  category: string;
  description?: string;
  double_handed: boolean;
  organization_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useOrganizationServices = () => {
  return useTenantAwareQuery(
    ['organization-services'],
    async (organizationId: string) => {
      const { data, error } = await createTenantQuery(organizationId)
        .services()
        .eq('status', 'active')
        .order('title');
      
      if (error) throw error;
      return data as OrganizationService[];
    }
  );
};