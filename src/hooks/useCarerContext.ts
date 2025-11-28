import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSafe } from './useAuthSafe';

export interface CarerContextData {
  staffId: string;
  staffProfile: any;
  branchInfo: any;
}

/**
 * Unified carer context hook that provides staff ID and profile data
 * This replaces multiple separate RPC calls with a single cached context
 */
export const useCarerContext = () => {
  const { user } = useAuthSafe();

  return useQuery({
    queryKey: ['carer-context', user?.id],
    queryFn: async (): Promise<CarerContextData> => {
      if (!user?.id) throw new Error('No authenticated user');

      console.log('[useCarerContext] Fetching carer context for user:', user.id);
      
      // Get staff record with branch info in one call
      const { data, error } = await supabase
        .rpc('get_staff_profile_by_auth_user_id', {
          auth_user_id_param: user.id
        });

      if (error) {
        console.error('[useCarerContext] Error fetching carer context:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('No staff record found for this user');
      }

      const staffProfile = data[0];
      console.log('[useCarerContext] Staff profile loaded:', staffProfile);

      // Get branch info with organization name - use maybeSingle to avoid errors
      const { data: branchData, error: branchError } = await supabase
        .from('branches')
        .select(`
          id,
          name,
          status,
          address,
          organization_id,
          organizations (
            name
          )
        `)
        .eq('id', staffProfile.branch_id)
        .maybeSingle();

      if (branchError) {
        console.error('[useCarerContext] Error fetching branch:', branchError);
        throw branchError;
      }

      if (!branchData) {
        console.warn('[useCarerContext] No branch found for ID:', staffProfile.branch_id);
      }

      console.log('[useCarerContext] Returning context:', {
        staffId: staffProfile.id,
        authUserId: user.id,
        branchId: staffProfile.branch_id
      });

      return {
        staffId: staffProfile.id,
        staffProfile,
        branchInfo: branchData ? {
          ...branchData,
          organization_name: (branchData.organizations as any)?.name || ''
        } : null
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - carer context doesn't change often
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on every navigation
    retry: 2,
  });
};