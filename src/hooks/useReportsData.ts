
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ReportsDataParams {
  branchId: string;
  startDate?: string;
  endDate?: string;
}

interface ClientReportsData {
  clientActivity: Array<{
    name: string;
    active: number;
    inactive: number;
    new: number;
  }>;
  demographics: Array<{
    name: string;
    value: number;
  }>;
  serviceUtilization: Array<{
    name: string;
    value: number;
  }>;
}

interface StaffReportsData {
  performance: Array<{
    name: string;
    completedTasks: number;
    onTimePercentage: number;
  }>;
  availability: Array<{
    day: string;
    available: number;
    unavailable: number;
  }>;
}

interface FinancialReportsData {
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  serviceRevenue: Array<{
    name: string;
    value: number;
  }>;
}

interface OperationalReportsData {
  taskCompletion: Array<{
    day: string;
    scheduled: number;
    completed: number;
    cancelled: number;
  }>;
}

export function useClientReportsData({ branchId, startDate, endDate }: ReportsDataParams) {
  return useQuery({
    queryKey: ['client-reports', branchId, startDate, endDate],
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
    enabled: !!branchId,
  });
}

export function useStaffReportsData({ branchId, startDate, endDate }: ReportsDataParams) {
  return useQuery({
    queryKey: ['staff-reports', branchId, startDate, endDate],
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
    enabled: !!branchId,
  });
}

export function useFinancialReportsData({ branchId, startDate, endDate }: ReportsDataParams) {
  return useQuery({
    queryKey: ['financial-reports', branchId, startDate, endDate],
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
    enabled: !!branchId,
  });
}

export function useOperationalReportsData({ branchId, startDate, endDate }: ReportsDataParams) {
  return useQuery({
    queryKey: ['operational-reports', branchId, startDate, endDate],
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
    enabled: !!branchId,
  });
}

export function useServiceReportsData({ branchId, startDate, endDate }: ReportsDataParams) {
  return useQuery({
    queryKey: ['service-reports', branchId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_branch_chart_data', {
        p_branch_id: branchId
      });
      
      if (error) {
        console.error('Error fetching service reports data:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!branchId,
  });
}

export function useComplianceReportsData({ branchId, startDate, endDate }: ReportsDataParams) {
  return useQuery({
    queryKey: ['compliance-reports', branchId, startDate, endDate],
    queryFn: async () => {
      return {
        trainingCompliance: [],
        incidentTypes: []
      };
    },
    enabled: !!branchId,
  });
}
