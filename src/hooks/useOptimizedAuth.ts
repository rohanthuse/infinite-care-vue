import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { withProgressiveTimeout } from '@/utils/authRecovery';

/**
 * Optimized auth operations with circuit breaker and caching
 */
export const useOptimizedAuth = () => {
  const [operationCache, setOperationCache] = useState<Map<string, { data: any; timestamp: number }>>(new Map());
  const [failureCount, setFailureCount] = useState<Map<string, number>>(new Map());

  const CACHE_DURATION = 30000; // 30 seconds
  const MAX_FAILURES = 3;
  const CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute

  const isCircuitOpen = useCallback((operation: string): boolean => {
    const failures = failureCount.get(operation) || 0;
    return failures >= MAX_FAILURES;
  }, [failureCount]);

  const resetCircuit = useCallback((operation: string) => {
    setFailureCount(prev => {
      const newMap = new Map(prev);
      newMap.delete(operation);
      return newMap;
    });
  }, []);

  const recordFailure = useCallback((operation: string) => {
    setFailureCount(prev => {
      const newMap = new Map(prev);
      const currentFailures = newMap.get(operation) || 0;
      newMap.set(operation, currentFailures + 1);
      return newMap;
    });
  }, []);

  const getCachedResult = useCallback((key: string) => {
    const cached = operationCache.get(key);
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      console.log(`[OptimizedAuth] Using cached result for ${key}`);
      return cached.data;
    }
    return null;
  }, [operationCache]);

  const setCachedResult = useCallback((key: string, data: any) => {
    setOperationCache(prev => {
      const newMap = new Map(prev);
      newMap.set(key, { data, timestamp: Date.now() });
      return newMap;
    });
  }, []);

  /**
   * Optimized role detection with caching and circuit breaker
   */
  const getRoleWithOptimization = useCallback(async (userId: string) => {
    const cacheKey = `role-${userId}`;
    const operationKey = 'get_user_role';

    // Check cache first
    const cachedResult = getCachedResult(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Check circuit breaker
    if (isCircuitOpen(operationKey)) {
      console.warn('[OptimizedAuth] Circuit breaker open for role detection');
      throw new Error('Role detection temporarily unavailable');
    }

    try {
      const result = await withProgressiveTimeout(
        Promise.resolve(supabase.rpc('get_user_highest_role', { p_user_id: userId }).single()),
        [3000, 6000, 10000],
        'Role detection'
      );

      if (result.error) {
        throw result.error;
      }

      // Cache successful result
      setCachedResult(cacheKey, result.data);
      resetCircuit(operationKey);
      
      return result.data;
    } catch (error) {
      recordFailure(operationKey);
      throw error;
    }
  }, [getCachedResult, setCachedResult, isCircuitOpen, resetCircuit, recordFailure]);

  /**
   * Optimized organization detection
   */
  const getOrganizationWithOptimization = useCallback(async (userId: string) => {
    const cacheKey = `org-${userId}`;
    const operationKey = 'get_user_organization';

    // Check cache first
    const cachedResult = getCachedResult(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Check circuit breaker
    if (isCircuitOpen(operationKey)) {
      console.warn('[OptimizedAuth] Circuit breaker open for organization detection');
      return null; // Allow fallback for org detection
    }

    try {
      // Execute queries individually with proper typing
      const membershipPromise = withProgressiveTimeout(
        Promise.resolve(supabase
          .from('organization_members')
          .select('role, organization_id, organizations(slug)')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('joined_at', { ascending: false })),
        [2000, 4000],
        'Organization membership query'
      );

      const staffPromise = withProgressiveTimeout(
        Promise.resolve(supabase
          .from('staff')
          .select(`
            branch_id,
            branches!staff_branch_id_fkey(
              organization_id,
              organizations!branches_organization_id_fkey(slug)
            )
          `)
          .eq('auth_user_id', userId)
          .eq('status', 'Active')
          .maybeSingle()),
        [2000, 4000],
        'Staff organization query'
      );

      const clientPromise = withProgressiveTimeout(
        Promise.resolve(supabase
          .from('clients')
          .select(`
            branch_id,
            branches!clients_branch_id_fkey(
              organization_id,
              organizations!branches_organization_id_fkey(slug)
            )
          `)
          .eq('auth_user_id', userId)
          .maybeSingle()),
        [2000, 4000],
        'Client organization query'
      );

      const [membershipResult, staffResult, clientResult] = await Promise.allSettled([
        membershipPromise,
        staffPromise,
        clientPromise
      ]);

      let orgSlug = null;

      // Process membership result
      if (membershipResult.status === 'fulfilled' && membershipResult.value.data?.length > 0) {
        const prioritizedMemberships = membershipResult.value.data
          .filter((m: any) => m.organizations?.slug)
          .sort((a: any, b: any) => {
            const roleOrder = { owner: 1, admin: 2, member: 3 };
            const aOrder = roleOrder[a.role as keyof typeof roleOrder] || 999;
            const bOrder = roleOrder[b.role as keyof typeof roleOrder] || 999;
            return aOrder - bOrder;
          });

        if (prioritizedMemberships.length > 0) {
          orgSlug = prioritizedMemberships[0].organizations.slug;
        }
      }

      // Process staff result if no org found
      if (!orgSlug && staffResult.status === 'fulfilled' && staffResult.value.data?.branches?.organizations?.slug) {
        orgSlug = staffResult.value.data.branches.organizations.slug;
      }

      // Process client result if no org found
      if (!orgSlug && clientResult.status === 'fulfilled' && clientResult.value.data?.branches?.organizations?.slug) {
        orgSlug = clientResult.value.data.branches.organizations.slug;
      }

      // Cache result (even if null)
      setCachedResult(cacheKey, orgSlug);
      resetCircuit(operationKey);

      return orgSlug;
    } catch (error) {
      recordFailure(operationKey);
      console.error('[OptimizedAuth] Organization detection failed:', error);
      return null; // Return null instead of throwing to allow graceful degradation
    }
  }, [getCachedResult, setCachedResult, isCircuitOpen, resetCircuit, recordFailure]);

  /**
   * Clear all caches and circuit breakers
   */
  const clearOptimizationCache = useCallback(() => {
    setOperationCache(new Map());
    setFailureCount(new Map());
    console.log('[OptimizedAuth] Cache and circuit breakers cleared');
  }, []);

  return {
    getRoleWithOptimization,
    getOrganizationWithOptimization,
    clearOptimizationCache,
    isCircuitOpen
  };
};