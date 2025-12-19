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
  expense_source?: string;
  booking_id?: string;
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
  // Extended rate fields
  pay_based_on?: string;
  charge_type?: string;
  rate_15_minutes?: number;
  rate_30_minutes?: number;
  rate_45_minutes?: number;
  rate_60_minutes?: number;
  consecutive_hours?: number;
  service_type?: string;
  time_from?: string;
  time_until?: string;
  rate_category?: string;
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
          updated_at,
          expense_source,
          booking_id
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

      // Get unique staff IDs and client IDs from travel records
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
            console.error('Error fetching staff data for travel records:', staffError);
          } else {
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
            console.error('Error fetching client data for travel records:', clientError);
          } else {
            clientData?.forEach(client => {
              clientMap.set(client.id, client);
            });
          }
        } catch (clientFetchError) {
          console.error('Failed to fetch client data:', clientFetchError);
        }
      }

      // Transform the data to include staff and client info
      const transformedData = (data || []).map(record => ({
        ...record,
        staff: staffMap.get(record.staff_id) || null,
        client: clientMap.get(record.client_id) || null
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
        .gt('extra_time_minutes', 0)
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
      queryClient.invalidateQueries({ queryKey: ['my-expenses'] });
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
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['payroll-records'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Payroll record created successfully');
      
      // Send notification to staff
      try {
        const { notifyStaffPayrollCreated } = await import('@/utils/notificationHelpers');
        await notifyStaffPayrollCreated({
          staffId: data.staff_id,
          branchId: data.branch_id,
          payrollId: data.id,
          payPeriodStart: data.pay_period_start,
          payPeriodEnd: data.pay_period_end,
          netPay: data.net_pay,
          paymentStatus: data.payment_status,
        });
      } catch (notifError) {
        console.error('[useCreatePayrollRecord] Failed to send notification:', notifError);
      }
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

// Hook to create extra time record
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

export const useDeletePayrollRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, branchId }: { id: string; branchId: string }) => {
      console.log('Deleting payroll record:', id);
      
      const { error } = await supabase
        .from('payroll_records')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting payroll record:', error);
        throw error;
      }
      
      return { id, branchId };
    },
    onSuccess: (data) => {
      // Invalidate the payroll records cache to refresh the table
      queryClient.invalidateQueries({ queryKey: ['payroll-records', data.branchId] });
      queryClient.invalidateQueries({ queryKey: ['payroll-records'] });
      
      toast.success('Payroll record deleted successfully');
    },
    onError: (error: any) => {
      console.error('Failed to delete payroll record:', error);
      toast.error('Failed to delete payroll record. Please try again.');
    },
  });
};

// Hook to get staff list for dropdowns
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
        .eq('status', 'Active');

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

// Hook to create a service rate
export function useCreateServiceRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rateData: Omit<ServiceRate, 'id' | 'created_at' | 'updated_at'>) => {
      console.log('[useCreateServiceRate] Creating rate with data:', rateData);
      
      if (!rateData.branch_id) {
        throw new Error('branch_id is required to create a service rate');
      }
      
      if (!rateData.created_by) {
        throw new Error('created_by is required to create a service rate');
      }
      
      const { data, error } = await supabase
        .from('service_rates')
        .insert(rateData)
        .select()
        .single();

      if (error) {
        console.error('[useCreateServiceRate] Error creating rate:', error);
        throw error;
      }
      
      console.log('[useCreateServiceRate] Rate created successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-rates'] });
    },
  });
}

// Hook to update a service rate
export function useUpdateServiceRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rateId, updates }: { rateId: string; updates: Partial<ServiceRate> }) => {
      const { data, error } = await supabase
        .from('service_rates')
        .update(updates)
        .eq('id', rateId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-rates'] });
    },
  });
}

// Hook to delete a service rate
export function useDeleteServiceRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rateId: string) => {
      if (!rateId) {
        console.error('[useDeleteServiceRate] No rateId provided');
        throw new Error('Rate ID is required for deletion');
      }
      
      console.log('[useDeleteServiceRate] Deleting rate:', rateId);
      
      const { error } = await supabase
        .from('service_rates')
        .delete()
        .eq('id', rateId);

      if (error) {
        console.error('[useDeleteServiceRate] Delete failed:', error);
        throw error;
      }
      
      console.log('[useDeleteServiceRate] Rate deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-rates'] });
    },
  });
}

// Hook to get clients list for dropdowns
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

      // Notify the carer
      try {
        await supabase.functions.invoke('create-expense-notifications', {
          body: {
            action: 'approved',
            expense_id: id,
            staff_id: data.staff_id,
            branch_id: branchId,
            expense_source: 'extra_time',
            expense_type: 'Extra Time',
            amount: data.total_cost
          }
        });
      } catch (notifyError) {
        console.error('[useApproveExtraTime] Failed to send notification:', notifyError);
      }

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
    mutationFn: async ({ id, branchId, reason }: { id: string; branchId: string; reason?: string }) => {
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

      // Notify the carer
      try {
        await supabase.functions.invoke('create-expense-notifications', {
          body: {
            action: 'rejected',
            expense_id: id,
            staff_id: data.staff_id,
            branch_id: branchId,
            expense_source: 'extra_time',
            expense_type: 'Extra Time',
            amount: data.total_cost,
            rejection_reason: reason
          }
        });
      } catch (notifyError) {
        console.error('[useRejectExtraTime] Failed to send notification:', notifyError);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['extra-time-records'] });
      queryClient.invalidateQueries({ queryKey: ['carer-payments'] });
      queryClient.invalidateQueries({ queryKey: ['my-extra-time'] });
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
      // Get the current auth user
      const { data: authData } = await supabase.auth.getUser();
      const authUserId = authData.user?.id;
      
      // Look up the staff record to get the staff ID (required by foreign key constraint)
      let approvedByStaffId: string | null = null;
      if (authUserId) {
        const { data: staffData } = await supabase
          .from('staff')
          .select('id')
          .eq('auth_user_id', authUserId)
          .maybeSingle();
        
        approvedByStaffId = staffData?.id || null;
      }
      
      const { data, error } = await supabase
        .from('expenses')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: approvedByStaffId
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Send notification to the carer
      try {
        await supabase.functions.invoke('create-expense-notifications', {
          body: {
            action: 'approved',
            expense_id: id,
            staff_id: data.staff_id,
            branch_id: branchId,
            expense_source: data.expense_source || 'general_claim',
            expense_type: data.category,
            amount: data.amount
          }
        });
      } catch (notifyError) {
        console.error('[useApproveExpense] Failed to send notification:', notifyError);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['carer-payments'] });
      queryClient.invalidateQueries({ queryKey: ['my-expenses'] });
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
    mutationFn: async ({ id, branchId, reason }: { id: string; branchId: string; reason?: string }) => {
      // Get the current auth user
      const { data: authData } = await supabase.auth.getUser();
      const authUserId = authData.user?.id;
      
      // Look up the staff record to get the staff ID (required by foreign key constraint)
      let approvedByStaffId: string | null = null;
      if (authUserId) {
        const { data: staffData } = await supabase
          .from('staff')
          .select('id')
          .eq('auth_user_id', authUserId)
          .maybeSingle();
        
        approvedByStaffId = staffData?.id || null;
      }
      
      const { data, error } = await supabase
        .from('expenses')
        .update({ 
          status: 'rejected',
          approved_at: new Date().toISOString(),
          approved_by: approvedByStaffId
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Send notification to the carer
      try {
        await supabase.functions.invoke('create-expense-notifications', {
          body: {
            action: 'rejected',
            expense_id: id,
            staff_id: data.staff_id,
            branch_id: branchId,
            expense_source: data.expense_source || 'general_claim',
            expense_type: data.category,
            amount: data.amount,
            rejection_reason: reason
          }
        });
      } catch (notifyError) {
        console.error('[useRejectExpense] Failed to send notification:', notifyError);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['carer-payments'] });
      queryClient.invalidateQueries({ queryKey: ['my-expenses'] });
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

      // Notify the carer
      try {
        await supabase.functions.invoke('create-expense-notifications', {
          body: {
            action: 'approved',
            expense_id: id,
            staff_id: data.staff_id,
            branch_id: branchId,
            expense_source: 'travel_mileage',
            expense_type: 'Travel & Mileage',
            amount: data.total_cost
          }
        });
      } catch (notifyError) {
        console.error('[useApproveTravelRecord] Failed to send notification:', notifyError);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['travel-records'] });
      queryClient.invalidateQueries({ queryKey: ['carer-payments'] });
      queryClient.invalidateQueries({ queryKey: ['my-travel'] });
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
    mutationFn: async ({ id, branchId, reason }: { id: string; branchId: string; reason?: string }) => {
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

      // Notify the carer
      try {
        await supabase.functions.invoke('create-expense-notifications', {
          body: {
            action: 'rejected',
            expense_id: id,
            staff_id: data.staff_id,
            branch_id: branchId,
            expense_source: 'travel_mileage',
            expense_type: 'Travel & Mileage',
            amount: data.total_cost,
            rejection_reason: reason
          }
        });
      } catch (notifyError) {
        console.error('[useRejectTravelRecord] Failed to send notification:', notifyError);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['travel-records'] });
      queryClient.invalidateQueries({ queryKey: ['carer-payments'] });
      queryClient.invalidateQueries({ queryKey: ['my-travel'] });
      toast.success('Travel record rejected');
    },
    onError: (error) => {
      console.error('Error rejecting travel record:', error);
      toast.error('Failed to reject travel record');
    },
  });
}
