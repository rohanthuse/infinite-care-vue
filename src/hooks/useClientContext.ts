import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSafe } from './useAuthSafe';

export interface ClientContextData {
  clientId: string;
  clientProfile: any;
  branchInfo: {
    id: string;
    name: string;
    status: string;
    organization_name: string;
  } | null;
}

/**
 * Unified client context hook that provides client ID, profile, and branch data
 * This provides cached context for the client dashboard
 */
export const useClientContext = () => {
  const { user } = useAuthSafe();

  return useQuery({
    queryKey: ['client-context', user?.id],
    queryFn: async (): Promise<ClientContextData> => {
      if (!user?.id) throw new Error('No authenticated user');

      console.log('[useClientContext] Fetching client context for user:', user.id);
      
      // Try to load cached data first for instant paint
      const cachedKey = `clientContext-${user.id}`;
      const cached = localStorage.getItem(cachedKey);
      if (cached) {
        console.log('[useClientContext] Using cached data for instant paint');
      }
      
      // Get client record linked to this auth user
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, branch_id, status')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (clientError) {
        console.error('[useClientContext] Error fetching client:', clientError);
        throw clientError;
      }

      if (!clientData) {
        throw new Error('No client record found for this user');
      }

      console.log('[useClientContext] Client profile loaded:', clientData);

      // Get branch info with organization name
      let branchInfo = null;
      if (clientData.branch_id) {
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
          .eq('id', clientData.branch_id)
          .maybeSingle();

        if (branchError) {
          console.error('[useClientContext] Error fetching branch:', branchError);
        } else if (branchData) {
          branchInfo = {
            ...branchData,
            organization_name: (branchData.organizations as any)?.name || ''
          };
        }
      }

      const result: ClientContextData = {
        clientId: clientData.id,
        clientProfile: clientData,
        branchInfo
      };

      // Cache the result for instant paint next time
      try {
        localStorage.setItem(cachedKey, JSON.stringify(result));
      } catch (e) {
        console.warn('[useClientContext] Failed to cache context:', e);
      }

      console.log('[useClientContext] Returning context:', {
        clientId: clientData.id,
        authUserId: user.id,
        branchId: clientData.branch_id
      });

      return result;
    },
    enabled: !!user?.id,
    // Use cached data for instant initial render
    initialData: () => {
      try {
        if (user?.id) {
          const cachedKey = `clientContext-${user.id}`;
          const cached = localStorage.getItem(cachedKey);
          if (cached) {
            console.log('[useClientContext] Using cached data as initialData');
            return JSON.parse(cached);
          }
        }
      } catch (e) {
        console.warn('[useClientContext] Failed to parse cached data in initialData:', e);
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });
};
