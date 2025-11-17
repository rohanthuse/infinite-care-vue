import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCarerContext } from './useCarerContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Prefetch hook for carer pages
 * Prefetches data for common navigation paths to improve perceived performance
 */
export const useCarerPagePrefetch = () => {
  const queryClient = useQueryClient();
  const { data: carerContext } = useCarerContext();
  
  useEffect(() => {
    if (!carerContext?.staffId) return;
    
    // Prefetch common pages data on idle (after 1 second)
    const prefetchTimer = setTimeout(() => {
      // Prefetch clients data
      queryClient.prefetchQuery({
        queryKey: ['carer-clients', carerContext.staffId],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('bookings')
            .select(`
              client_id,
              clients(*)
            `)
            .eq('staff_id', carerContext.staffId)
            .not('client_id', 'is', null);

          if (error) throw error;

          // Get unique clients
          const uniqueClients = Array.from(
            new Map(
              data
                ?.filter(b => b.clients)
                .map(b => [b.client_id, b.clients])
            ).values()
          );

          return uniqueClients;
        },
      });
      
      // Prefetch appointments data
      queryClient.prefetchQuery({
        queryKey: ['carer-appointments-full', carerContext.staffId, 'all'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('bookings')
            .select(`
              *,
              clients(first_name, last_name, phone, address),
              services(title, description)
            `)
            .eq('staff_id', carerContext.staffId)
            .order('start_time');

          if (error) throw error;
          return data || [];
        },
      });
    }, 1000); // Prefetch after 1 second of idle
    
    return () => clearTimeout(prefetchTimer);
  }, [carerContext?.staffId, queryClient]);
};
