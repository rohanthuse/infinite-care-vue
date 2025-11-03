import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ServiceType } from '@/types/clientAccounting';

export interface StaffRateSchedule {
  id: string;
  staff_id: string;
  service_type_codes: string[];
  authority_type: string;
  start_date: string;
  end_date?: string;
  days_covered: string[];
  time_from: string;
  time_until: string;
  rate_category: string;
  pay_based_on: string;
  charge_type: string;
  base_rate: number;
  rate_15_minutes?: number;
  rate_30_minutes?: number;
  rate_45_minutes?: number;
  rate_60_minutes?: number;
  consecutive_hours_rate?: number;
  bank_holiday_multiplier: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  branch_id?: string;
  organization_id?: string;
  is_vatable: boolean;
}

// Fetch staff rate schedules
export const useStaffRateSchedules = (staffId: string) => {
  return useQuery({
    queryKey: ['staff-rate-schedules', staffId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_rate_schedules')
        .select('*')
        .eq('staff_id', staffId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data as StaffRateSchedule[];
    },
    enabled: !!staffId
  });
};

// Create staff rate schedule
export const useCreateStaffRateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (schedule: Omit<StaffRateSchedule, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => {
      const { data, error } = await supabase
        .from('staff_rate_schedules')
        .insert([schedule])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-rate-schedules'] });
      toast.success('Rate schedule created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create rate schedule');
    }
  });
};

// Update staff rate schedule
export const useUpdateStaffRateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StaffRateSchedule> & { id: string }) => {
      const { data, error } = await supabase
        .from('staff_rate_schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-rate-schedules'] });
      toast.success('Rate schedule updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update rate schedule');
    }
  });
};

// Delete (deactivate) staff rate schedule
export const useDeleteStaffRateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('staff_rate_schedules')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-rate-schedules'] });
      toast.success('Rate schedule deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete rate schedule');
    }
  });
};
