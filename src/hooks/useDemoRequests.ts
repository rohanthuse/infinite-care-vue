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
        
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[DemoRequests] Current session:', session ? 'authenticated' : 'not authenticated');
        
        // Use the security definer function that bypasses RLS
        const { data, error } = await supabase.rpc('get_demo_request_stats');

        if (error) {
          console.error('Error fetching demo request stats:', error);
          // Fallback to direct query for debugging
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('demo_requests')
            .select('id, status, created_at')
            .order('created_at', { ascending: false });
          
          console.log('[DemoRequests] Fallback query result:', { fallbackData, fallbackError });
          
          if (fallbackError) {
            console.error('Fallback query also failed:', fallbackError);
            return {
              totalRequests: 0,
              pendingRequests: 0,
              lastRequestDate: null
            };
          }
          
          const totalRequests = fallbackData.length;
          const pendingRequests = fallbackData.filter(req => req.status === 'pending').length;
          const lastRequestDate = fallbackData.length > 0 ? fallbackData[0].created_at : null;
          
          console.log('[DemoRequests] Using fallback data:', { totalRequests, pendingRequests, lastRequestDate });
          
          return {
            totalRequests,
            pendingRequests,
            lastRequestDate
          } as DemoRequestStats;
        }

        console.log('[DemoRequests] RPC data:', data);
        
        // Handle both array and single object responses
        const result = Array.isArray(data) ? data[0] : data;
        
        return {
          totalRequests: result?.total_requests || 0,
          pendingRequests: result?.pending_requests || 0,
          lastRequestDate: result?.last_request_date || null
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