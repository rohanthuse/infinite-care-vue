import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TravelRate {
  id: string;
  title: string;
  rate_per_mile: number;
  from_date: string;
  status: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export const useTravelRates = (branchId?: string) => {
  return useQuery({
    queryKey: ['travel-rates', branchId],
    queryFn: async () => {
      let query = supabase
        .from('travel_rates')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as TravelRate[];
    },
    enabled: !!branchId
  });
};