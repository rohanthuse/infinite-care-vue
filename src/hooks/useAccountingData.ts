
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types for database entities
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
  };
  client?: {
    first_name: string;
    last_name: string;
  };
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
  };
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
  created_at: string;
  updated_at: string;
  staff?: {
    first_name: string;
    last_name: string;
  };
  client?: {
    first_name: string;
    last_name: string;
  };
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
  staff?: {
    first_name: string;
    last_name: string;
  };
  client?: {
    first_name: string;
    last_name: string;
  };
}

// Hook to fetch expenses for a branch
export function useExpenses(branchId?: string) {
  return useQuery({
    queryKey: ['expenses', branchId],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          staff:staff_id(first_name, last_name),
          client:client_id(first_name, last_name)
        `)
        .order('expense_date', { ascending: false });

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ExpenseRecord[];
    },
    enabled: !!branchId,
  });
}

// Hook to fetch payroll records for a branch
export function usePayrollRecords(branchId?: string) {
  return useQuery({
    queryKey: ['payroll-records', branchId],
    queryFn: async () => {
      let query = supabase
        .from('payroll_records')
        .select(`
          *,
          staff:staff_id(first_name, last_name, email)
        `)
        .order('pay_period_start', { ascending: false });

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PayrollRecord[];
    },
    enabled: !!branchId,
  });
}

// Hook to fetch travel records for a branch
export function useTravelRecords(branchId?: string) {
  return useQuery({
    queryKey: ['travel-records', branchId],
    queryFn: async () => {
      let query = supabase
        .from('travel_records')
        .select(`
          *,
          staff:staff_id(first_name, last_name),
          client:client_id(first_name, last_name)
        `)
        .order('travel_date', { ascending: false });

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TravelRecord[];
    },
    enabled: !!branchId,
  });
}

// Hook to fetch service rates for a branch
export function useServiceRates(branchId?: string) {
  return useQuery({
    queryKey: ['service-rates', branchId],
    queryFn: async () => {
      let query = supabase
        .from('service_rates')
        .select('*')
        .order('effective_from', { ascending: false });

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ServiceRate[];
    },
    enabled: !!branchId,
  });
}

// Hook to fetch extra time records for a branch
export function useExtraTimeRecords(branchId?: string) {
  return useQuery({
    queryKey: ['extra-time-records', branchId],
    queryFn: async () => {
      let query = supabase
        .from('extra_time_records')
        .select(`
          *,
          staff:staff_id(first_name, last_name),
          client:client_id(first_name, last_name)
        `)
        .order('work_date', { ascending: false });

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ExtraTimeRecord[];
    },
    enabled: !!branchId,
  });
}

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
    onError: (error) => {
      console.error('Error creating service rate:', error);
      toast.error('Failed to create service rate');
    },
  });
}

export function useCreateExtraTimeRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (extraTime: Omit<ExtraTimeRecord, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('extra_time_records')
        .insert(extraTime)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['extra-time-records'] });
      toast.success('Extra time record created successfully');
    },
    onError: (error) => {
      console.error('Error creating extra time record:', error);
      toast.error('Failed to create extra time record');
    },
  });
}

// Hook to get staff list for dropdowns
export function useStaffList(branchId?: string) {
  return useQuery({
    queryKey: ['staff-list', branchId],
    queryFn: async () => {
      let query = supabase
        .from('staff')
        .select('id, first_name, last_name, email')
        .eq('status', 'active');

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!branchId,
  });
}

// Hook to get clients list for dropdowns
export function useClientsList(branchId?: string) {
  return useQuery({
    queryKey: ['clients-list', branchId],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select('id, first_name, last_name, email');

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!branchId,
  });
}
