
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

// Type guard functions to safely convert Json to our interfaces
function isClientReportsData(data: any): data is ClientReportsData {
  return data && 
    Array.isArray(data.clientActivity) && 
    Array.isArray(data.demographics) && 
    Array.isArray(data.serviceUtilization);
}

function isStaffReportsData(data: any): data is StaffReportsData {
  return data && 
    Array.isArray(data.performance) && 
    Array.isArray(data.availability);
}

function isFinancialReportsData(data: any): data is FinancialReportsData {
  return data && 
    Array.isArray(data.monthlyRevenue) && 
    Array.isArray(data.serviceRevenue);
}

function isOperationalReportsData(data: any): data is OperationalReportsData {
  return data && Array.isArray(data.taskCompletion);
}

// Default fallback data
const defaultClientReportsData: ClientReportsData = {
  clientActivity: [],
  demographics: [],
  serviceUtilization: []
};

const defaultStaffReportsData: StaffReportsData = {
  performance: [],
  availability: []
};

const defaultFinancialReportsData: FinancialReportsData = {
  monthlyRevenue: [],
  serviceRevenue: []
};

const defaultOperationalReportsData: OperationalReportsData = {
  taskCompletion: []
};

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
      
      // Safely convert Json to ClientReportsData
      if (isClientReportsData(data)) {
        return data;
      }
      
      console.warn('Invalid client reports data structure, using fallback');
      return defaultClientReportsData;
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
      
      // Safely convert Json to StaffReportsData
      if (isStaffReportsData(data)) {
        return data;
      }
      
      console.warn('Invalid staff reports data structure, using fallback');
      return defaultStaffReportsData;
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
      
      // Safely convert Json to FinancialReportsData
      if (isFinancialReportsData(data)) {
        return data;
      }
      
      console.warn('Invalid financial reports data structure, using fallback');
      return defaultFinancialReportsData;
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
      
      // Safely convert Json to OperationalReportsData
      if (isOperationalReportsData(data)) {
        return data;
      }
      
      console.warn('Invalid operational reports data structure, using fallback');
      return defaultOperationalReportsData;
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
