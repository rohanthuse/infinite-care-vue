import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LeaveRequest {
  id: string;
  staff_id: string;
  branch_id: string;
  leave_type: 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'emergency';
  start_date: string;
  end_date: string;
  total_days: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  review_notes?: string;
  staff_name?: string;
  reviewer_name?: string;
}

export interface AnnualLeave {
  id: string;
  branch_id?: string;
  leave_date: string;
  leave_name: string;
  is_company_wide: boolean;
  is_recurring: boolean;
  created_by: string;
  created_at: string;
}

export interface CreateLeaveRequest {
  staff_id: string;
  branch_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason?: string;
}

export interface CreateAnnualLeave {
  branch_id?: string;
  leave_date: string;
  leave_name: string;
  is_company_wide?: boolean;
  is_recurring?: boolean;
}

// Hook for staff leave requests
export const useLeaveRequests = (branchId?: string) => {
  return useQuery({
    queryKey: ['leave-requests', branchId],
    queryFn: async () => {
      let query = supabase
        .from('staff_leave_requests')
        .select(`
          *,
          staff!staff_id (
            first_name,
            last_name
          ),
          reviewer:staff!reviewed_by (
            first_name,
            last_name
          )
        `)
        .order('requested_at', { ascending: false });

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data?.map(item => ({
        ...item,
        staff_name: item.staff ? `${item.staff.first_name} ${item.staff.last_name}` : 'Unknown',
        reviewer_name: item.reviewer ? `${item.reviewer.first_name} ${item.reviewer.last_name}` : undefined
      })) as LeaveRequest[];
    },
    enabled: Boolean(branchId)
  });
};

// Hook for annual leave calendar
export const useAnnualLeave = (branchId?: string) => {
  return useQuery({
    queryKey: ['annual-leave', branchId],
    queryFn: async () => {
      let query = supabase
        .from('annual_leave_calendar')
        .select('*')
        .order('leave_date', { ascending: true });

      if (branchId) {
        // Show both branch-specific holidays AND company-wide holidays
        query = query.or(`branch_id.eq.${branchId},is_company_wide.eq.true`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AnnualLeave[];
    }
  });
};

// Hook to create leave request
export const useCreateLeaveRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateLeaveRequest) => {
      const { data, error } = await supabase
        .from('staff_leave_requests')
        .insert([{
          ...request,
          total_days: 0 // Will be calculated by trigger
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Leave request submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    },
    onError: (error) => {
      console.error('Error creating leave request:', error);
      toast.error('Failed to submit leave request');
    }
  });
};

// Hook to update leave request status
export const useUpdateLeaveRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      review_notes 
    }: { 
      id: string; 
      status: 'approved' | 'rejected'; 
      review_notes?: string; 
    }) => {
      const { data, error } = await supabase
        .from('staff_leave_requests')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          review_notes
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(`Leave request ${variables.status}`);
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    },
    onError: (error) => {
      console.error('Error updating leave request:', error);
      toast.error('Failed to update leave request');
    }
  });
};

// Hook to create annual leave
export const useCreateAnnualLeave = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leave: CreateAnnualLeave) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('annual_leave_calendar')
        .insert([{
          ...leave,
          created_by: userData.user?.id || ''
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Annual leave date added');
      queryClient.invalidateQueries({ queryKey: ['annual-leave'] });
    },
    onError: (error) => {
      console.error('Error creating annual leave:', error);
      toast.error('Failed to add annual leave date');
    }
  });
};

// Hook to delete annual leave
export const useDeleteAnnualLeave = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('annual_leave_calendar')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Annual leave date removed');
      queryClient.invalidateQueries({ queryKey: ['annual-leave'] });
    },
    onError: (error) => {
      console.error('Error deleting annual leave:', error);
      toast.error('Failed to remove annual leave date');
    }
  });
};

// Hook to get leave status for specific dates
export const useLeaveStatus = (branchId: string, startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['leave-status', branchId, startDate, endDate],
    queryFn: async () => {
      const promises = [];

      // Get approved leave requests
      if (startDate && endDate) {
        promises.push(
          supabase
            .from('staff_leave_requests')
            .select('staff_id, start_date, end_date, leave_type')
            .eq('branch_id', branchId)
            .eq('status', 'approved')
            .gte('end_date', startDate)
            .lte('start_date', endDate)
        );
      }

      // Get annual leave dates
      promises.push(
        supabase
          .from('annual_leave_calendar')
          .select('*')
          .or(`branch_id.eq.${branchId},is_company_wide.eq.true`)
          .gte('leave_date', startDate || '2024-01-01')
          .lte('leave_date', endDate || '2024-12-31')
      );

      const [leaveRequests, annualLeave] = await Promise.all(promises);

      return {
        staffLeave: leaveRequests?.data || [],
        annualLeave: annualLeave?.data || []
      };
    },
    enabled: Boolean(branchId)
  });
};