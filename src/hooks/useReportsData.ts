
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ReportsDataParams {
  branchId: string;
  startDate?: string;
  endDate?: string;
}

export function useClientReportsData({ branchId, startDate, endDate }: ReportsDataParams) {
  return useQuery({
    queryKey: ['client-reports', branchId, startDate, endDate],
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
    enabled: !!branchId,
  });
}

export function useStaffReportsData({ branchId, startDate, endDate }: ReportsDataParams) {
  return useQuery({
    queryKey: ['staff-reports', branchId, startDate, endDate],
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
    enabled: !!branchId,
  });
}

export function useFinancialReportsData({ branchId, startDate, endDate }: ReportsDataParams) {
  return useQuery({
    queryKey: ['financial-reports', branchId, startDate, endDate],
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
    enabled: !!branchId,
  });
}

export function useOperationalReportsData({ branchId, startDate, endDate }: ReportsDataParams) {
  return useQuery({
    queryKey: ['operational-reports', branchId, startDate, endDate],
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
    enabled: !!branchId,
  });
}

export function useServiceReportsData({ branchId, startDate, endDate }: ReportsDataParams) {
  return useQuery({
    queryKey: ['service-reports', branchId, startDate, endDate],
    queryFn: async () => {
      // For now, we'll use existing chart data function
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
      // This would need additional database functions for compliance data
      // For now, return empty structure
      return {
        trainingCompliance: [],
        incidentTypes: []
      };
    },
    enabled: !!branchId,
  });
}
