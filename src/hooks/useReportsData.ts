
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReportsDataParams {
  branchId: string;
  startDate?: string;
  endDate?: string;
}

// Define the expected data structures
interface ClientReportsData {
  clientActivity?: Array<{
    name: string;
    active: number;
    inactive: number;
    new: number;
  }>;
  demographics?: Array<{
    name: string;
    value: number;
  }>;
  serviceUtilization?: Array<{
    name: string;
    value: number;
  }>;
}

interface StaffReportsData {
  performance?: Array<{
    name: string;
    completedTasks: number;
    onTimePercentage: number;
  }>;
  availability?: Array<{
    day: string;
    available: number;
    unavailable: number;
  }>;
  qualifications?: Array<{
    name: string;
    value: number;
  }>;
}

interface FinancialReportsData {
  monthlyRevenue?: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  serviceRevenue?: Array<{
    name: string;
    value: number;
  }>;
}

interface OperationalReportsData {
  taskCompletion?: Array<{
    day: string;
    scheduled: number;
    completed: number;
    cancelled: number;
  }>;
}

// Hook for client reports data
export const useClientReportsData = ({ branchId, startDate, endDate }: ReportsDataParams) => {
  return useQuery({
    queryKey: ['client-reports-data', branchId, startDate, endDate],
    queryFn: async (): Promise<ClientReportsData> => {
      const { data, error } = await supabase.rpc('get_client_reports_data', {
        p_branch_id: branchId,
        p_start_date: startDate || null,
        p_end_date: endDate || null
      });

      if (error) {
        console.error('Error fetching client reports data:', error);
        throw error;
      }

      return data as ClientReportsData;
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });
};

// Hook for staff reports data
export const useStaffReportsData = ({ branchId, startDate, endDate }: ReportsDataParams) => {
  return useQuery({
    queryKey: ['staff-reports-data', branchId, startDate, endDate],
    queryFn: async (): Promise<StaffReportsData> => {
      const { data, error } = await supabase.rpc('get_staff_reports_data', {
        p_branch_id: branchId,
        p_start_date: startDate || null,
        p_end_date: endDate || null
      });

      if (error) {
        console.error('Error fetching staff reports data:', error);
        throw error;
      }

      return data as StaffReportsData;
    },
    refetchInterval: 300000,
  });
};

// Hook for financial reports data
export const useFinancialReportsData = ({ branchId, startDate, endDate }: ReportsDataParams) => {
  return useQuery({
    queryKey: ['financial-reports-data', branchId, startDate, endDate],
    queryFn: async (): Promise<FinancialReportsData> => {
      const { data, error } = await supabase.rpc('get_financial_reports_data', {
        p_branch_id: branchId,
        p_start_date: startDate || null,
        p_end_date: endDate || null
      });

      if (error) {
        console.error('Error fetching financial reports data:', error);
        throw error;
      }

      return data as FinancialReportsData;
    },
    refetchInterval: 300000,
  });
};

// Hook for operational reports data
export const useOperationalReportsData = ({ branchId, startDate, endDate }: ReportsDataParams) => {
  return useQuery({
    queryKey: ['operational-reports-data', branchId, startDate, endDate],
    queryFn: async (): Promise<OperationalReportsData> => {
      const { data, error } = await supabase.rpc('get_operational_reports_data', {
        p_branch_id: branchId,
        p_start_date: startDate || null,
        p_end_date: endDate || null
      });

      if (error) {
        console.error('Error fetching operational reports data:', error);
        throw error;
      }

      return data as OperationalReportsData;
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
