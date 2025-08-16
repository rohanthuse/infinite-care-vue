import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DemoRequestStats {
  totalRequests: number;
  pendingRequests: number;
  lastRequestDate: string | null;
}

export const useDemoRequestStats = () => {
  return useQuery({
    queryKey: ['demo-request-stats'],
    queryFn: async () => {
      try {
        console.log('[DemoRequests] Fetching demo request stats...');
        
        // Direct query to demo_requests table 
        const { data, error } = await supabase
          .from('demo_requests')
          .select('id, status, created_at')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching demo request stats:', error);
          return {
            totalRequests: 0,
            pendingRequests: 0,
            lastRequestDate: null
          };
        }

        const totalRequests = data.length;
        const pendingRequests = data.filter(req => req.status === 'pending').length;
        const lastRequestDate = data.length > 0 ? data[0].created_at : null;

        console.log('[DemoRequests] Fetched data:', { 
          totalRequests, 
          pendingRequests, 
          lastRequestDate,
          rawData: data 
        });

        return {
          totalRequests,
          pendingRequests,
          lastRequestDate
        } as DemoRequestStats;
        
      } catch (error) {
        console.error('Unexpected error fetching demo request stats:', error);
        return {
          totalRequests: 0,
          pendingRequests: 0,
          lastRequestDate: null
        };
      }
    },
    retry: 2,
    retryDelay: 1000,
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
    staleTime: 1000, // Consider data stale after 1 second to force fresh data
  });
};