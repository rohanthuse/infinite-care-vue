import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { getSubscriptionLimit } from '@/lib/subscriptionLimits';

export interface SubscriptionLimits {
  currentClientCount: number;
  maxClients: number;
  remainingSlots: number;
  canAddClient: boolean;
  isLoading: boolean;
  subscriptionPlan: string | null;
  subscriptionExpiresAt: string | null;
  usagePercentage: number;
}

/**
 * Hook to check subscription limits for client creation
 */
export function useSubscriptionLimits(): SubscriptionLimits {
  const { organization } = useTenant();

  const { data, isLoading } = useQuery({
    queryKey: ['subscription-limits', organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        throw new Error('Organization not found');
      }

      // Get all branches for this organization
      const { data: branches, error: branchError } = await supabase
        .from('branches')
        .select('id')
        .eq('organization_id', organization.id);

      if (branchError) throw branchError;

      const branchIds = branches?.map(b => b.id) || [];

      // Count clients across all branches
      let clientCount = 0;
      if (branchIds.length > 0) {
        const { count, error: countError } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .in('branch_id', branchIds);

        if (countError) throw countError;
        clientCount = count || 0;
      }

      return {
        clientCount,
        subscriptionPlan: organization.subscription_plan,
        maxUsers: organization.max_users,
        subscriptionExpiresAt: organization.subscription_expires_at,
      };
    },
    enabled: !!organization?.id,
  });

  const maxClients = getSubscriptionLimit(
    data?.subscriptionPlan || null,
    data?.maxUsers || null
  );

  const currentClientCount = data?.clientCount || 0;
  const remainingSlots = Math.max(0, maxClients - currentClientCount);
  const canAddClient = remainingSlots > 0;
  const usagePercentage = maxClients > 0 ? (currentClientCount / maxClients) * 100 : 0;

  return {
    currentClientCount,
    maxClients,
    remainingSlots,
    canAddClient,
    isLoading,
    subscriptionPlan: data?.subscriptionPlan || null,
    subscriptionExpiresAt: data?.subscriptionExpiresAt || null,
    usagePercentage,
  };
}
