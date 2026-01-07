import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSafe } from './useAuthSafe';

/**
 * Utility function to clear carer context cache from localStorage
 * Call this after branch transfers or when carer data needs to be refreshed
 */
export const clearCarerContextCache = (userId?: string) => {
  if (userId) {
    localStorage.removeItem(`carerContext-${userId}`);
  } else {
    // Clear all context caches
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('carerContext-')) {
        localStorage.removeItem(key);
      }
    });
  }
};

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
      
      // Try to load cached data first for instant paint
      const cachedKey = `carerContext-${user.id}`;
      const cached = localStorage.getItem(cachedKey);
      if (cached) {
        console.log('[useCarerContext] Using cached data for instant paint');
      }
      
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
          organizations!branches_organization_id_fkey (
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

      const result = {
        staffId: staffProfile.id,
        staffProfile,
        branchInfo: branchData ? {
          ...branchData,
          organization_name: (branchData.organizations as any)?.name || ''
        } : null
      };

      // Cache the result for instant paint next time
      try {
        localStorage.setItem(`carerContext-${user.id}`, JSON.stringify(result));
      } catch (e) {
        console.warn('[useCarerContext] Failed to cache context:', e);
      }

      console.log('[useCarerContext] Returning context:', {
        staffId: staffProfile.id,
        authUserId: user.id,
        branchId: staffProfile.branch_id
      });

      return result;
    },
    enabled: !!user?.id,
    // Use cached data for instant initial render
    initialData: () => {
      try {
        if (user?.id) {
          const cachedKey = `carerContext-${user.id}`;
          const cached = localStorage.getItem(cachedKey);
          if (cached) {
            console.log('[useCarerContext] Using cached data as initialData');
            return JSON.parse(cached);
          }
        }
      } catch (e) {
        console.warn('[useCarerContext] Failed to parse cached data in initialData:', e);
      }
      return undefined;
    },
    staleTime: 0, // Always fetch fresh context data - prevents stale cache issues
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
    refetchOnWindowFocus: true,
    refetchOnMount: 'always', // Always refetch to ensure fresh data
    retry: 2,
    throwOnError: false, // Prevent throwing during render - handle errors gracefully
  });
};