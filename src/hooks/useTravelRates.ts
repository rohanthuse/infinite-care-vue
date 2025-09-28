import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TravelRate {
  id: string;
  title: string;
  rate_per_mile: number;
  rate_per_hour: number;
  from_date: string;
  status: string;
  user_type: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export const useTravelRates = (branchId?: string) => {
  return useQuery({
    queryKey: ['travel-rates', branchId],
    queryFn: async (): Promise<TravelRate[]> => {
      const query = supabase
        .from('travel_rates')
        .select('*')
        .eq('status', 'active')
        .order('title');

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    enabled: true
  });
};