import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  getSubscriptionLimit, 
  getRemainingSlots, 
  isAtSubscriptionLimit,
  formatSubscriptionPlan,
  getUsagePercentage,
  shouldShowUpgradePrompt
} from '@/lib/subscriptionHelpers';

interface OrganizationSubscription {
  id: string;
  subscription_plan: string;
  max_users: number;
  subscription_status: string;
  subscription_expires_at: string | null;
  trial_ends_at: string | null;
  is_trial: boolean;
  created_at: string;
}

interface SubscriptionData {
  plan: string;
  planFormatted: string;
  planLimit: number;
  currentClientCount: number;
  remainingSlots: number;
  usagePercentage: number;
  isAtLimit: boolean;
  shouldUpgrade: boolean;
  subscriptionStatus: string;
  expiresAt: Date | null;
  trialEndsAt: Date | null;
  isTrial: boolean;
  subscriptionStartDate: Date;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useOrganizationSubscription = (organizationId?: string): SubscriptionData => {
  // Fetch organization subscription details
  const { data: orgData, isLoading: isOrgLoading, error: orgError, refetch: refetchOrg } = useQuery({
    queryKey: ['organization-subscription', organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID is required');

      const { data, error } = await supabase
        .from('organizations')
        .select('id, subscription_plan, max_users, subscription_status, subscription_expires_at, trial_ends_at, is_trial, created_at')
        .eq('id', organizationId)
        .single();

      if (error) throw error;
      return data as OrganizationSubscription;
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch current client count
  const { data: clientCount, isLoading: isCountLoading, error: countError, refetch: refetchCount } = useQuery({
    queryKey: ['organization-client-count', organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID is required');

      const { count, error } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!organizationId,
    staleTime: 1000 * 30, // 30 seconds - more frequent updates for counts
  });

  const refetch = () => {
    refetchOrg();
    refetchCount();
  };

  // Return loading state if no organization ID
  if (!organizationId) {
    return {
      plan: 'basic',
      planFormatted: 'Basic Plan',
      planLimit: 50,
      currentClientCount: 0,
      remainingSlots: 50,
      usagePercentage: 0,
      isAtLimit: false,
      shouldUpgrade: false,
      subscriptionStatus: 'unknown',
      expiresAt: null,
      trialEndsAt: null,
      isTrial: false,
      subscriptionStartDate: new Date(),
      isLoading: false,
      error: new Error('No organization ID provided'),
      refetch,
    };
  }

  const isLoading = isOrgLoading || isCountLoading;
  const error = orgError || countError;

  const plan = orgData?.subscription_plan || 'basic';
  const planLimit = getSubscriptionLimit(plan);
  const currentCount = clientCount || 0;
  const remainingSlots = getRemainingSlots(currentCount, planLimit);
  const isAtLimit = isAtSubscriptionLimit(currentCount, plan);
  const usagePercentage = getUsagePercentage(currentCount, planLimit);
  const shouldUpgrade = shouldShowUpgradePrompt(currentCount, planLimit);

  return {
    plan,
    planFormatted: formatSubscriptionPlan(plan),
    planLimit,
    currentClientCount: currentCount,
    remainingSlots,
    usagePercentage,
    isAtLimit,
    shouldUpgrade,
    subscriptionStatus: orgData?.subscription_status || 'unknown',
    expiresAt: orgData?.subscription_expires_at ? new Date(orgData.subscription_expires_at) : null,
    trialEndsAt: orgData?.trial_ends_at ? new Date(orgData.trial_ends_at) : null,
    isTrial: orgData?.is_trial || false,
    subscriptionStartDate: orgData?.created_at ? new Date(orgData.created_at) : new Date(),
    isLoading,
    error: error as Error | null,
    refetch,
  };
};
