
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReportsDataParams {
  branchId: string;
  startDate?: string;
  endDate?: string;
}

// Hook for client reports data
export const useClientReportsData = ({ branchId, startDate, endDate }: ReportsDataParams) => {
  return useQuery({
    queryKey: ['client-reports-data', branchId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_client_reports_data', {
        p_branch_id: branchId,
        p_start_date: startDate || null,
        p_end_date: endDate || null
      });

      if (error) {
        console.error('Error fetching client reports data:', error);
        throw error;
      }

      return data;
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });
};

// Hook for staff reports data
export const useStaffReportsData = ({ branchId, startDate, endDate }: ReportsDataParams) => {
  return useQuery({
    queryKey: ['staff-reports-data', branchId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_staff_reports_data', {
        p_branch_id: branchId,
        p_start_date: startDate || null,
        p_end_date: endDate || null
      });

      if (error) {
        console.error('Error fetching staff reports data:', error);
        throw error;
      }

      return data;
    },
    refetchInterval: 300000,
  });
};

// Hook for financial reports data
export const useFinancialReportsData = ({ branchId, startDate, endDate }: ReportsDataParams) => {
  return useQuery({
    queryKey: ['financial-reports-data', branchId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_financial_reports_data', {
        p_branch_id: branchId,
        p_start_date: startDate || null,
        p_end_date: endDate || null
      });

      if (error) {
        console.error('Error fetching financial reports data:', error);
        throw error;
      }

      return data;
    },
    refetchInterval: 300000,
  });
};

// Hook for operational reports data
export const useOperationalReportsData = ({ branchId, startDate, endDate }: ReportsDataParams) => {
  return useQuery({
    queryKey: ['operational-reports-data', branchId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_operational_reports_data', {
        p_branch_id: branchId,
        p_start_date: startDate || null,
        p_end_date: endDate || null
      });

      if (error) {
        console.error('Error fetching operational reports data:', error);
        throw error;
      }

      return data;
    },
    refetchInterval: 300000,
  });
};

// Helper function to transform data with fallbacks
export const transformChartData = (data: any, defaultData: any[]) => {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return defaultData;
  }
  return data;
};
