import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { differenceInBusinessDays, addDays } from "date-fns";

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
  staff_id?: string;
  staff_name?: string;
  leave_date: string;
  leave_name: string;
  is_company_wide: boolean;
  is_recurring: boolean;
  is_weekly_recurring?: boolean;
  created_by: string;
  created_at: string;
  start_time?: string;
  end_time?: string;
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
  staff_id?: string;
  leave_date: string;
  leave_name: string;
  is_company_wide?: boolean;
  is_recurring?: boolean;
  is_weekly_recurring?: boolean;
  start_time?: string | null;
  end_time?: string | null;
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
        .select(`
          *,
          staff:staff_id (
            id,
            first_name,
            last_name
          )
        `)
        .order('leave_date', { ascending: true });

      if (branchId) {
        // Show branch-specific holidays for this branch
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Map staff name to a flat field
      return data?.map(item => ({
        ...item,
        staff_name: item.staff ? `${item.staff.first_name} ${item.staff.last_name}` : undefined
      })) as AnnualLeave[];
    }
  });
};

// Helper function to send leave request notifications
const sendLeaveNotification = async (payload: {
  leave_request_id: string;
  action: 'submitted' | 'approved' | 'rejected';
  staff_id: string;
  branch_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reviewer_id?: string;
  review_notes?: string;
}) => {
  try {
    const { error } = await supabase.functions.invoke('create-leave-request-notifications', {
      body: payload
    });
    if (error) {
      console.error('Error sending leave notification:', error);
    }
  } catch (err) {
    console.error('Failed to send leave notification:', err);
  }
};

// Hook to create leave request
export const useCreateLeaveRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateLeaveRequest) => {
      // Calculate business days between start and end dates
      const startDate = new Date(request.start_date);
      const endDate = new Date(request.end_date);
      const totalDays = differenceInBusinessDays(addDays(endDate, 1), startDate);

      // Validate business days
      if (totalDays <= 0) {
        throw new Error('Leave request must be for at least 1 business day');
      }

      const { data, error } = await supabase
        .from('staff_leave_requests')
        .insert([{
          ...request,
          total_days: totalDays,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Leave request submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      
      // Send notification to admins
      sendLeaveNotification({
        leave_request_id: data.id,
        action: 'submitted',
        staff_id: data.staff_id,
        branch_id: data.branch_id,
        leave_type: data.leave_type,
        start_date: data.start_date,
        end_date: data.end_date
      });
    },
    onError: (error: any) => {
      console.error('Error creating leave request:', error);
      const errorMessage = error?.message || 'Failed to submit leave request';
      toast.error(errorMessage);
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
    onSuccess: (data, variables) => {
      toast.success(`Leave request ${variables.status}`);
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      
      // Send notification to staff member
      sendLeaveNotification({
        leave_request_id: data.id,
        action: variables.status,
        staff_id: data.staff_id,
        branch_id: data.branch_id,
        leave_type: data.leave_type,
        start_date: data.start_date,
        end_date: data.end_date,
        review_notes: variables.review_notes
      });
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
      
      // If weekly recurring, create multiple entries for the next 52 weeks
      if (leave.is_weekly_recurring && leave.leave_date) {
        const baseDate = new Date(leave.leave_date);
        const entries = [];
        
        for (let week = 0; week < 52; week++) {
          const weekDate = new Date(baseDate);
          weekDate.setDate(baseDate.getDate() + (week * 7));
          
          entries.push({
            branch_id: leave.branch_id,
            staff_id: leave.staff_id,
            leave_date: weekDate.toISOString().split('T')[0],
            leave_name: leave.leave_name,
            is_company_wide: leave.is_company_wide || false,
            is_recurring: leave.is_recurring || false,
            is_weekly_recurring: true,
            start_time: leave.start_time,
            end_time: leave.end_time,
            created_by: userData.user?.id || ''
          });
        }
        
        const { data, error } = await supabase
          .from('annual_leave_calendar')
          .insert(entries)
          .select();
          
        if (error) throw error;
        return data[0]; // Return first entry for success message
      }
      
      // Single entry (non-recurring)
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
    onSuccess: async (data) => {
      console.log('✅ Leave creation successful:', data);
      
      await queryClient.invalidateQueries({ queryKey: ['annual-leave'] });
      await queryClient.invalidateQueries({ 
        queryKey: ['organization-calendar'],
        exact: false
      });
      
      // CRITICAL: Force immediate refetch to ensure calendar updates
      await queryClient.refetchQueries({ 
        queryKey: ['organization-calendar'],
        exact: false,
        type: 'active'
      });
      
      // Also invalidate stats queries
      await queryClient.invalidateQueries({ 
        queryKey: ['organization-calendar-stats'],
        exact: false
      });
      
      console.log('✅ Calendar refetched after leave creation');
      
      toast.success(
        `Leave added for ${data.leave_date}`,
        {
          description: 'View it in the organization calendar',
        }
      );
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
    onSuccess: async () => {
      console.log('✅ Leave deletion successful');
      
      await queryClient.invalidateQueries({ queryKey: ['annual-leave'] });
      await queryClient.invalidateQueries({ 
        queryKey: ['organization-calendar'],
        exact: false
      });
      
      // Force immediate refetch
      await queryClient.refetchQueries({ 
        queryKey: ['organization-calendar'],
        exact: false,
        type: 'active'
      });
      
      // Invalidate stats
      await queryClient.invalidateQueries({ 
        queryKey: ['organization-calendar-stats'],
        exact: false
      });
      
      console.log('✅ Calendar refetched after leave deletion');
      
      toast.success('Annual leave date removed');
    },
    onError: (error) => {
      console.error('Error deleting annual leave:', error);
      toast.error('Failed to remove annual leave date');
    }
  });
};

// Hook to delete multiple annual leave entries (for grouped weekly recurring)
export const useDeleteBulkAnnualLeave = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('annual_leave_calendar')
        .delete()
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: async () => {
      console.log('✅ Bulk leave deletion successful');
      
      await queryClient.invalidateQueries({ queryKey: ['annual-leave'] });
      await queryClient.invalidateQueries({ 
        queryKey: ['organization-calendar'],
        exact: false
      });
      
      // Force immediate refetch
      await queryClient.refetchQueries({ 
        queryKey: ['organization-calendar'],
        exact: false,
        type: 'active'
      });
      
      // Invalidate stats
      await queryClient.invalidateQueries({ 
        queryKey: ['organization-calendar-stats'],
        exact: false
      });
      
      console.log('✅ Calendar refetched after bulk leave deletion');
      
      toast.success('Holiday entries deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting annual leave entries:', error);
      toast.error('Failed to delete holiday entries');
    }
  });
};

// Hook to update annual leave
export const useUpdateAnnualLeave = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      leaveId, 
      updates 
    }: { 
      leaveId: string; 
      updates: Partial<CreateAnnualLeave> 
    }) => {
      const { data, error } = await supabase
        .from('annual_leave_calendar')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', leaveId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      console.log('✅ Leave update successful:', data);
      
      await queryClient.invalidateQueries({ queryKey: ['annual-leave'] });
      await queryClient.invalidateQueries({ 
        queryKey: ['organization-calendar'],
        exact: false
      });
      
      // Force immediate refetch
      await queryClient.refetchQueries({ 
        queryKey: ['organization-calendar'],
        exact: false,
        type: 'active'
      });
      
      // Invalidate stats
      await queryClient.invalidateQueries({ 
        queryKey: ['organization-calendar-stats'],
        exact: false
      });
      
      console.log('✅ Calendar refetched after leave update');
      
      toast.success('Leave updated successfully');
    },
    onError: (error) => {
      console.error('Error updating annual leave:', error);
      toast.error('Failed to update leave');
    }
  });
};

// Hook to fetch single annual leave by ID
export const useAnnualLeaveById = (leaveId: string) => {
  return useQuery({
    queryKey: ['annual-leave', leaveId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('annual_leave_calendar')
        .select(`
          *,
          branches (
            id,
            name
          )
        `)
        .eq('id', leaveId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!leaveId
  });
};

// Hook to edit approved leave request
export const useEditLeaveRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      start_date,
      end_date,
      leave_type,
      reason
    }: { 
      id: string; 
      start_date: string;
      end_date: string;
      leave_type: string;
      reason?: string;
    }) => {
      // Calculate new total days
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      const totalDays = differenceInBusinessDays(addDays(endDate, 1), startDate);

      if (totalDays <= 0) {
        throw new Error('Leave request must be for at least 1 business day');
      }

      const { data, error } = await supabase
        .from('staff_leave_requests')
        .update({
          start_date,
          end_date,
          leave_type,
          reason,
          total_days: totalDays,
          review_notes: `[Edited on ${new Date().toISOString()}]`
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Leave request updated successfully');
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-booking-conflicts'] });
    },
    onError: (error: any) => {
      console.error('Error updating leave request:', error);
      toast.error(error?.message || 'Failed to update leave request');
    }
  });
};

// Hook to cancel approved leave request
export const useCancelLeaveRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      cancellation_reason 
    }: { 
      id: string; 
      cancellation_reason?: string; 
    }) => {
      const { data, error } = await supabase
        .from('staff_leave_requests')
        .update({
          status: 'cancelled',
          review_notes: `[Cancelled on ${new Date().toISOString()}]${cancellation_reason ? ` Reason: ${cancellation_reason}` : ''}`
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Leave request cancelled - carer is now available for bookings');
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-booking-conflicts'] });
    },
    onError: (error) => {
      console.error('Error cancelling leave request:', error);
      toast.error('Failed to cancel leave request');
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