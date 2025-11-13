import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

export interface StaffWorkingHours {
  id: string;
  staff_id: string;
  branch_id: string;
  organization_id: string;
  work_date: string;
  start_time: string;
  end_time: string;
  availability_type: 'shift' | 'on-call' | 'overtime';
  status: 'scheduled' | 'confirmed' | 'cancelled';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Fetch working hours for staff on a specific date
export const useStaffWorkingHours = (branchId: string, date: Date, staffIds?: string[]) => {
  return useQuery({
    queryKey: ['staff-working-hours', branchId, format(date, 'yyyy-MM-dd'), staffIds],
    queryFn: async () => {
      let query = supabase
        .from('staff_working_hours')
        .select('*')
        .eq('branch_id', branchId)
        .eq('work_date', format(date, 'yyyy-MM-dd'))
        .in('status', ['scheduled', 'confirmed']);

      if (staffIds && staffIds.length > 0) {
        query = query.in('staff_id', staffIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as StaffWorkingHours[];
    },
    enabled: !!branchId && !!date,
    staleTime: 1000 * 30, // 30 seconds
  });
};

// Add/Update working hours
export const useManageWorkingHours = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hours: Partial<StaffWorkingHours> & { staff_id: string; work_date: string; branch_id: string; organization_id: string; start_time: string; end_time: string }) => {
      if (hours.id) {
        // Update existing
        const { data, error } = await supabase
          .from('staff_working_hours')
          .update(hours as any)
          .eq('id', hours.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('staff_working_hours')
          .insert(hours as any)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-working-hours'] });
      queryClient.invalidateQueries({ queryKey: ['staff-schedule-events'] });
      toast.success('Working hours saved successfully');
    },
    onError: (error: any) => {
      console.error('Failed to save working hours:', error);
      toast.error('Failed to save working hours', {
        description: error.message || 'An unknown error occurred',
      });
    },
  });
};

// Bulk create working hours (for templates/patterns)
export const useBulkCreateWorkingHours = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hoursArray: Partial<StaffWorkingHours>[]) => {
      const { data, error } = await supabase
        .from('staff_working_hours')
        .insert(hoursArray as any)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-working-hours'] });
      toast.success('Working hours created successfully');
    },
    onError: (error: any) => {
      console.error('Failed to create working hours:', error);
      toast.error('Failed to create working hours', {
        description: error.message || 'An unknown error occurred',
      });
    },
  });
};
