
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ServiceReportsDataParams {
  branchId: string;
  startDate?: string;
  endDate?: string;
}

interface ServiceUtilization {
  name: string;
  bookings: number;
  avgDuration: number;
  revenue: number;
}

interface ServiceTrend {
  month: string;
  service: string;
  count: number;
}

interface ClientSatisfaction {
  name: string;
  score: number;
  rating: string;
}

export interface ServiceReportsData {
  serviceUtilization: ServiceUtilization[];
  serviceTrends: ServiceTrend[];
  clientSatisfaction: ClientSatisfaction[];
}

export const useServiceReportsData = ({ branchId, startDate, endDate }: ServiceReportsDataParams) => {
  return useQuery({
    queryKey: ['service-reports-data', branchId, startDate, endDate],
    queryFn: async (): Promise<ServiceReportsData> => {
      const { data, error } = await supabase.rpc('get_service_reports_data', {
        p_branch_id: branchId,
        p_start_date: startDate || null,
        p_end_date: endDate || null
      });

      if (error) {
        console.error('Error fetching service reports data:', error);
        throw error;
      }

      return data as ServiceReportsData;
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });
};
