import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types for database entities that match the database schema
export interface ExpenseRecord {
  id: string;
  branch_id: string;
  staff_id?: string;
  client_id?: string;
  description: string;
  amount: number;
  expense_date: string;
  category: string;
  payment_method: string;
  receipt_url?: string;
  notes?: string;
  status: string;
  approved_by?: string;
  approved_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  staff?: {
    first_name: string;
    last_name: string;
  } | null;
  client?: {
    first_name: string;
    last_name: string;
  } | null;
}

export interface PayrollRecord {
  id: string;
  branch_id: string;
  staff_id: string;
  pay_period_start: string;
  pay_period_end: string;
  regular_hours: number;
  overtime_hours: number;
  hourly_rate: number;
  overtime_rate?: number;
  basic_salary: number;
  overtime_pay: number;
  bonus: number;
  gross_pay: number;
  tax_deduction: number;
  ni_deduction: number;
  pension_deduction: number;
  other_deductions: number;
  net_pay: number;
  payment_status: string;
  payment_method: string;
  payment_date?: string;
  payment_reference?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  staff?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export interface TravelRecord {
  id: string;
  branch_id: string;
  staff_id: string;
  client_id?: string;
  booking_id?: string;
  travel_date: string;
  start_location: string;
  end_location: string;
  distance_miles: number;
  travel_time_minutes?: number;
  vehicle_type: string;
  mileage_rate: number;
  total_cost: number;
  purpose: string;
  receipt_url?: string;
  notes?: string;
  status: string;
  approved_by?: string;
  approved_at?: string;
  reimbursed_at?: string;
  organization_id?: string;
  created_at: string;
  updated_at: string;
  staff?: {
    first_name: string;
    last_name: string;
  } | null;
  client?: {
    first_name: string;
    last_name: string;
  } | null;
}

export interface ServiceRate {
  id: string;
  branch_id: string;
  service_id?: string;
  service_name: string;
  service_code: string;
  rate_type: string;
  amount: number;
  currency: string;
  effective_from: string;
  effective_to?: string;
  client_type: string;
  funding_source: string;
  applicable_days: string[];
  is_default: boolean;
  status: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ExtraTimeRecord {
  id: string;
  branch_id: string;
  staff_id: string;
  client_id?: string;
  booking_id?: string;
  work_date: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  actual_start_time?: string;
  actual_end_time?: string;
  scheduled_duration_minutes: number;
  actual_duration_minutes?: number;
  extra_time_minutes: number;
  hourly_rate: number;
  extra_time_rate?: number;
  total_cost: number;
  reason?: string;
  notes?: string;
  status: string;
  approved_by?: string;
  approved_at?: string;
  invoiced: boolean;
  invoice_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  staff?: {
    first_name: string;
    last_name: string;
  } | null;
  client?: {
    first_name: string;
    last_name: string;
  } | null;
}

// Hook to fetch expenses for a branch
export function useExpenses(branchId?: string) {
  return useQuery({
    queryKey: ['expenses', branchId],
    queryFn: async () => {
      if (!branchId) return [];

      console.log('Fetching expenses for branch:', branchId);

      const { data, error } = await supabase
        .from('expenses')
        .select(`
          id,
          branch_id,
          staff_id,
          client_id,
          description,
          amount,
          expense_date,
          category,
          payment_method,
          receipt_url,
          notes,
          status,
          approved_by,
          approved_at,
          created_by,
          created_at,
          updated_at
        `)
        .eq('branch_id', branchId)
        .order('expense_date', { ascending: false });

      if (error) {
        console.error('Error fetching expenses:', error);
        throw error;
      }

      // Get unique staff IDs and client IDs from expense records
      const staffIds = [...new Set((data || []).map(record => record.staff_id).filter(Boolean))];
      const clientIds = [...new Set((data || []).map(record => record.client_id).filter(Boolean))];
      
      let staffMap = new Map();
      let clientMap = new Map();
      
      // Fetch staff data if we have staff IDs
      if (staffIds.length > 0) {
        try {
          const { data: staffData, error: staffError } = await supabase
            .from('staff')
            .select('id, first_name, last_name')
            .in('id', staffIds);
          
          if (staffError) {
            console.error('Error fetching staff data:', staffError);
          } else {
            // Create a map for quick lookup
            staffData?.forEach(staff => {
              staffMap.set(staff.id, staff);
            });
          }
        } catch (staffFetchError) {
          console.error('Failed to fetch staff data:', staffFetchError);
        }
      }

      // Fetch client data if we have client IDs
      if (clientIds.length > 0) {
        try {
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('id, first_name, last_name')
            .in('id', clientIds);
          
          if (clientError) {
            console.error('Error fetching client data:', clientError);
          } else {
            // Create a map for quick lookup
            clientData?.forEach(client => {
              clientMap.set(client.id, client);
            });
          }
        } catch (clientFetchError) {
          console.error('Failed to fetch client data:', clientFetchError);
        }
      }

      // Transform the data to include staff and client info
      const transformedData = (data || []).map(expense => ({
        ...expense,
        staff: staffMap.get(expense.staff_id) || null,
        client: clientMap.get(expense.client_id) || null
      }));

      return transformedData as ExpenseRecord[];
    },
    enabled: !!branchId,
  });
}

// Hook to fetch payroll records for a branch
export function usePayrollRecords(branchId?: string) {
  return useQuery({
    queryKey: ['payroll-records', branchId],
    queryFn: async () => {
      if (!branchId) return [];

      console.log('Fetching payroll records for branch:', branchId);

      const { data, error } = await supabase
        .from('payroll_records')
        .select(`
          id,
          branch_id,
          staff_id,
          pay_period_start,
          pay_period_end,
          regular_hours,
          overtime_hours,
          hourly_rate,
          overtime_rate,
          basic_salary,
          overtime_pay,
          bonus,
          gross_pay,
          tax_deduction,
          ni_deduction,
          pension_deduction,
          other_deductions,
          net_pay,
          payment_status,
          payment_method,
          payment_date,
          payment_reference,
          notes,
          created_by,
          created_at,
          updated_at
        `)
        .eq('branch_id', branchId)
        .order('pay_period_start', { ascending: false });

      if (error) {
        console.error('Error fetching payroll records:', error);
        throw error;
      }

      // Get unique staff IDs from payroll records
      const staffIds = [...new Set((data || []).map(record => record.staff_id).filter(Boolean))];
      
      let staffMap = new Map();
      
      // Fetch staff data if we have staff IDs
      if (staffIds.length > 0) {
        try {
          const { data: staffData, error: staffError } = await supabase
            .from('staff')
            .select('id, first_name, last_name, email')
            .in('id', staffIds);
          
          if (staffError) {
            console.error('Error fetching staff data:', staffError);
          } else {
            // Create a map for quick lookup
            staffData?.forEach(staff => {
              staffMap.set(staff.id, staff);
            });
          }
        } catch (staffFetchError) {
          console.error('Failed to fetch staff data:', staffFetchError);
        }
      }

      // Transform the data to include staff info
      const transformedData = (data || []).map(record => ({
        ...record,
        staff: staffMap.get(record.staff_id) || null
      }));

      return transformedData as PayrollRecord[];
    },
    enabled: !!branchId,
  });
}

// Hook to fetch travel records for a branch
export function useTravelRecords(branchId?: string) {
  return useQuery({
    queryKey: ['travel-records', branchId],
    queryFn: async () => {
      if (!branchId) return [];

      const { data, error } = await supabase
        .from('travel_records')
        .select(`
          id,
          branch_id,
          staff_id,
          client_id,
          booking_id,
          travel_date,
          start_location,
          end_location,
          distance_miles,
          travel_time_minutes,
          vehicle_type,
          mileage_rate,
          total_cost,
          purpose,
          receipt_url,
          notes,
          status,
          approved_by,
          approved_at,
          reimbursed_at,
          organization_id,
          created_at,
          updated_at
        `)
        .eq('branch_id', branchId)
        .order('travel_date', { ascending: false });

      if (error) throw error;

      const transformedData = (data || []).map(record => ({
        ...record,
        staff: null,
        client: null
      }));

      return transformedData as TravelRecord[];
    },
    enabled: !!branchId,
  });
}

// Hook to fetch service rates for a branch
export function useServiceRates(branchId?: string) {
  return useQuery({
    queryKey: ['service-rates', branchId],
    queryFn: async () => {
      if (!branchId) return [];

      const { data, error } = await supabase
        .from('service_rates')
        .select('*')
        .eq('branch_id', branchId)
        .order('effective_from', { ascending: false });

      if (error) throw error;
      return (data || []) as ServiceRate[];
    },
    enabled: !!branchId,
  });
}

// Hook to fetch extra time records for a branch - FIXED WITH BETTER ERROR HANDLING
export function useExtraTimeRecords(branchId?: string) {
  return useQuery({
    queryKey: ['extra-time-records', branchId],
    queryFn: async () => {
      if (!branchId) {
        console.log('No branchId provided to useExtraTimeRecords');
        return [];
      }

      console.log('Fetching extra time records for branch:', branchId);

      const { data, error } = await supabase
        .from('extra_time_records')
        .select(`
          id,
          branch_id,
          staff_id,
          client_id,
          booking_id,
          work_date,
          scheduled_start_time,
          scheduled_end_time,
          actual_start_time,
          actual_end_time,
          scheduled_duration_minutes,
          actual_duration_minutes,
          extra_time_minutes,
          hourly_rate,
          extra_time_rate,
          total_cost,
          reason,
          notes,
          status,
          approved_by,
          approved_at,
          invoiced,
          invoice_id,
          created_at,
          updated_at
        `)
        .eq('branch_id', branchId)
        .order('work_date', { ascending: false });

      if (error) {
        console.error('Error fetching extra time records:', error);
        throw new Error(`Failed to fetch extra time records: ${error.message}`);
      }

      console.log('Extra time records fetched successfully:', data?.length || 0, 'records');

      const transformedData = (data || []).map(record => ({
        ...record,
        staff: null,
        client: null
      }));

      return transformedData as ExtraTimeRecord[];
    },
    enabled: !!branchId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Define the type for creating extra time records
export type CreateExtraTimeRecord = {
  branch_id: string;
  staff_id: string;
  client_id?: string | null;
  booking_id?: string | null;
  work_date: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  actual_start_time?: string | null;
  actual_end_time?: string | null;
  scheduled_duration_minutes: number;
  actual_duration_minutes?: number | null;
  extra_time_minutes: number;
  hourly_rate: number;
  extra_time_rate?: number | null;
  total_cost: number;
  reason?: string | null;
  notes?: string | null;
  status: string;
  approved_by?: string | null;
  approved_at?: string | null;
  invoiced: boolean;
  invoice_id?: string | null;
  created_by?: string | null;
  
};

// Mutation hooks for creating records
export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expense: Omit<ExpenseRecord, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert(expense)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense created successfully');
    },
    onError: (error) => {
      console.error('Error creating expense:', error);
      toast.error('Failed to create expense');
    },
  });
}

export function useCreatePayrollRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payroll: Omit<PayrollRecord, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('payroll_records')
        .insert(payroll)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payroll-records'] });
      toast.success('Payroll record created successfully');
    },
    onError: (error) => {
      console.error('Error creating payroll record:', error);
      toast.error('Failed to create payroll record');
    },
  });
}

export function useCreateTravelRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (travel: Omit<TravelRecord, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('travel_records')
        .insert(travel)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['travel-records'] });
      toast.success('Travel record created successfully');
    },
    onError: (error) => {
      console.error('Error creating travel record:', error);
      toast.error('Failed to create travel record');
    },
  });
}

export function useCreateServiceRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rate: Omit<ServiceRate, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('service_rates')
        .insert(rate)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service-rates'] });
      toast.success('Service rate created successfully');
    },
    onError: (error: any) => {
      console.error('Error creating service rate:', error);
      // Log the actual error message for debugging
      if (error?.message) {
        console.error('Supabase error message:', error.message);
      }
      toast.error('Failed to create service rate');
    },
  });
}

// Enhanced mutation for creating extra time records with better error handling
export function useCreateExtraTimeRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (extraTime: CreateExtraTimeRecord) => {
      console.log('Creating extra time record with data:', extraTime);
      
      // Validate required fields
      if (!extraTime.branch_id) {
        throw new Error('Branch ID is required');
      }
      if (!extraTime.staff_id) {
        throw new Error('Staff ID is required');
      }
      
      const { data, error } = await supabase
        .from('extra_time_records')
        .insert(extraTime)
        .select()
        .single();

      if (error) {
        console.error('Error creating extra time record:', error);
        throw new Error(`Failed to create extra time record: ${error.message}`);
      }
      
      console.log('Extra time record created successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['extra-time-records'] });
      
      if (data.status === 'approved') {
        toast.success('Extra time record created and automatically approved');
      } else {
        toast.success('Extra time record created and submitted for approval');
      }
    },
    onError: (error: Error) => {
      console.error('Error creating extra time record:', error);
      toast.error(`Failed to create extra time record: ${error.message}`);
    },
  });
}

export const useUpdateTravelRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...record }: { id: string } & Partial<TravelRecord>) => {
      // Remove fields that shouldn't be updated and add status preservation
      const { staff, client, ...updateData } = record as any;
      
      // Add status field back for updates (preserve existing status)
      if (!updateData.status) {
        const { data: existingRecord } = await supabase
          .from('travel_records')
          .select('status')
          .eq('id', id)
          .single();
        updateData.status = existingRecord?.status || 'pending';
      }
      
      const { data, error } = await supabase
        .from('travel_records')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating travel record:', error);
        throw new Error(`Failed to update travel record: ${error.message}`);
      }
      
      return data;
    },
    onSuccess: (data) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['travel-records', data.branch_id] });
      
      toast.success('Travel record updated successfully');
    },
    onError: (error: any) => {
      console.error('Failed to update travel record:', error);
      const errorMessage = error.message || 'Failed to update travel record. Please try again.';
      toast.error(errorMessage);
    },
  });
};

export const useDeleteTravelRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, branchId }: { id: string; branchId: string }) => {
      const { error } = await supabase
        .from('travel_records')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting travel record:', error);
        throw error;
      }
      
      return { id, branchId };
    },
    onSuccess: (data) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['travel-records', data.branchId] });
      
      toast.success('Travel record deleted successfully');
    },
    onError: (error: any) => {
      console.error('Failed to delete travel record:', error);
      toast.error('Failed to delete travel record. Please try again.');
    },
  });
};

export const useDeleteServiceRate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, branchId }: { id: string; branchId: string }) => {
      const { error } = await supabase
        .from('service_rates')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting service rate:', error);
        throw error;
      }
      
      return { id, branchId };
    },
    onSuccess: (data) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['service-rates', data.branchId] });
      
      toast.success('Service rate deleted successfully');
    },
    onError: (error: any) => {
      console.error('Failed to delete service rate:', error);
      const errorMessage = error?.message || 'Failed to delete service rate. Please try again.';
      toast.error(errorMessage);
    },
  });
};

// Hook to get staff list for dropdowns - FIXED STATUS FILTER
export function useStaffList(branchId?: string) {
  return useQuery({
    queryKey: ['staff-list', branchId],
    queryFn: async () => {
      if (!branchId) return [];

      console.log('Fetching staff list for branch:', branchId);

      const { data, error } = await supabase
        .from('staff')
        .select('id, first_name, last_name, email')
        .eq('branch_id', branchId)
        .eq('status', 'Active'); // Fixed: Changed from 'active' to 'Active'

      if (error) {
        console.error('Error fetching staff list:', error);
        throw error;
      }

      console.log('Staff list fetched:', data?.length || 0, 'records');
      return data || [];
    },
    enabled: !!branchId,
  });
}

// Hook to get clients list for dropdowns - FIXED STATUS FILTER
export function useClientsList(branchId?: string) {
  return useQuery({
    queryKey: ['clients-list', branchId],
    queryFn: async () => {
      if (!branchId) return [];

      console.log('Fetching clients list for branch:', branchId);

      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, pin_code')
        .eq('branch_id', branchId);
        // Note: Removed status filter as clients table may not have consistent status values

      if (error) {
        console.error('Error fetching clients list:', error);
        throw error;
      }

      console.log('Clients list fetched:', data?.length || 0, 'records');
      return data || [];
    },
    enabled: !!branchId,
  });
}

// Approval mutations for Extra Time, Expenses, and Travel Records
export function useApproveExtraTime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, branchId }: { id: string; branchId: string }) => {
      const { data, error } = await supabase
        .from('extra_time_records')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['extra-time-records'] });
      queryClient.invalidateQueries({ queryKey: ['carer-payments'] });
      toast.success('Extra time record approved successfully');
    },
    onError: (error) => {
      console.error('Error approving extra time:', error);
      toast.error('Failed to approve extra time record');
    },
  });
}

export function useRejectExtraTime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, branchId }: { id: string; branchId: string }) => {
      const { data, error } = await supabase
        .from('extra_time_records')
        .update({ 
          status: 'rejected',
          approved_at: new Date().toISOString(),
          approved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['extra-time-records'] });
      queryClient.invalidateQueries({ queryKey: ['carer-payments'] });
      toast.success('Extra time record rejected');
    },
    onError: (error) => {
      console.error('Error rejecting extra time:', error);
      toast.error('Failed to reject extra time record');
    },
  });
}

export function useApproveExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, branchId }: { id: string; branchId: string }) => {
      const { data, error } = await supabase
        .from('expenses')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['carer-payments'] });
      toast.success('Expense approved successfully');
    },
    onError: (error) => {
      console.error('Error approving expense:', error);
      toast.error('Failed to approve expense');
    },
  });
}

export function useRejectExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, branchId }: { id: string; branchId: string }) => {
      const { data, error } = await supabase
        .from('expenses')
        .update({ 
          status: 'rejected',
          approved_at: new Date().toISOString(),
          approved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['carer-payments'] });
      toast.success('Expense rejected');
    },
    onError: (error) => {
      console.error('Error rejecting expense:', error);
      toast.error('Failed to reject expense');
    },
  });
}

export function useApproveTravelRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, branchId }: { id: string; branchId: string }) => {
      const { data, error } = await supabase
        .from('travel_records')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['travel-records'] });
      queryClient.invalidateQueries({ queryKey: ['carer-payments'] });
      toast.success('Travel record approved successfully');
    },
    onError: (error) => {
      console.error('Error approving travel record:', error);
      toast.error('Failed to approve travel record');
    },
  });
}

export function useRejectTravelRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, branchId }: { id: string; branchId: string }) => {
      const { data, error } = await supabase
        .from('travel_records')
        .update({ 
          status: 'rejected',
          approved_at: new Date().toISOString(),
          approved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['travel-records'] });
      queryClient.invalidateQueries({ queryKey: ['carer-payments'] });
      toast.success('Travel record rejected');
    },
    onError: (error) => {
      console.error('Error rejecting travel record:', error);
      toast.error('Failed to reject travel record');
    },
  });
}
