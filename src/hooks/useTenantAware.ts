import { useQuery, useMutation, QueryKey, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

/**
 * Tenant-aware data fetching hook that automatically includes organization filtering
 */
export const useTenantAwareQuery = <TData = unknown, TError = Error>(
  queryKey: QueryKey,
  queryFn: (organizationId: string) => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
) => {
  const { organization } = useTenant();

  return useQuery({
    queryKey: [...queryKey, organization?.id],
    queryFn: () => {
      if (!organization?.id) {
        throw new Error('Organization context required for tenant-aware queries');
      }
      return queryFn(organization.id);
    },
    enabled: !!organization?.id && (options?.enabled !== false),
    ...options,
  });
};

/**
 * Tenant-aware mutation hook that automatically includes organization context
 */
export const useTenantAwareMutation = <TData = unknown, TVariables = unknown, TError = Error>(
  mutationFn: (variables: TVariables & { organizationId: string }) => Promise<TData>,
  options?: UseMutationOptions<TData, TError, TVariables>
) => {
  const { organization } = useTenant();

  return useMutation({
    mutationFn: (variables: TVariables) => {
      if (!organization?.id) {
        throw new Error('Organization context required for tenant-aware mutations');
      }
      return mutationFn({ ...variables, organizationId: organization.id });
    },
    ...options,
  });
};

/**
 * Helper function to create organization-filtered Supabase queries
 */
export const createTenantQuery = (organizationId: string) => ({
  // Get organization branches
  branches: () => 
    supabase
      .from('branches')
      .select('*')
      .eq('organization_id', organizationId),

  // Get organization staff through branches
  staff: () =>
    supabase
      .from('staff')
      .select('*, branches!inner(organization_id)')
      .eq('branches.organization_id', organizationId),

  // Get organization clients through branches
  clients: () =>
    supabase
      .from('clients')
      .select('*, branches!inner(organization_id)')
      .eq('branches.organization_id', organizationId),

  // Get organization bookings through branches
  bookings: () =>
    supabase
      .from('bookings')
      .select('*, branches!inner(organization_id)')
      .eq('branches.organization_id', organizationId),

  // Get organization services
  services: () =>
    supabase
      .from('services')
      .select('*')
      .or(`organization_id.eq.${organizationId},organization_id.is.null`),

  // Get organization documents through branches
  documents: () =>
    supabase
      .from('documents')
      .select('*, branches!inner(organization_id)')
      .eq('branches.organization_id', organizationId),

  // Get organization expenses
  expenses: () =>
    supabase
      .from('expenses')
      .select('*')
      .eq('organization_id', organizationId),

  // Get organization travel records
  travelRecords: () =>
    supabase
      .from('travel_records')
      .select('*')
      .eq('organization_id', organizationId),

  // Get organization extra time records
  extraTimeRecords: () =>
    supabase
      .from('extra_time_records')
      .select('*')
      .eq('organization_id', organizationId),
});

/**
 * Helper function to validate branch belongs to organization
 */
export const validateBranchInOrganization = async (branchId: string, organizationId: string): Promise<boolean> => {
  const { data: branch } = await supabase
    .from('branches')
    .select('id')
    .eq('id', branchId)
    .eq('organization_id', organizationId)
    .single();

  return !!branch;
};