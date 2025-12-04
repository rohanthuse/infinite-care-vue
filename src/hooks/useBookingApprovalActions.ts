import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ApproveRequestParams {
  requestId: string;
  bookingId: string;
  requestType: 'cancellation' | 'reschedule';
  adminNotes?: string;
  newDate?: string;
  newTime?: string;
}

interface RejectRequestParams {
  requestId: string;
  bookingId: string;
  requestType: 'cancellation' | 'reschedule';
  adminNotes: string;
}

// Fetch pending requests
export const useFetchPendingRequests = (branchId?: string) => {
  return useQuery({
    queryKey: ['pending-booking-requests', branchId],
    queryFn: async () => {
      let query = supabase
        .from('booking_change_requests')
        .select(`
          *,
          bookings (
            id,
            start_time,
            end_time,
            status,
            services (
              id,
              title
            ),
            staff (
              id,
              first_name,
              last_name
            ),
            clients (
              id,
              first_name,
              last_name
            )
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: true
  });
};

// Approve request
export const useApproveChangeRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ApproveRequestParams) => {
      const { requestId, bookingId, requestType, adminNotes, newDate, newTime } = params;

      // Validate required parameters
      if (!requestId || !bookingId) {
        throw new Error("Missing required request or booking ID");
      }

      // Get request details for notification
      const { data: requestData } = await supabase
        .from('booking_change_requests')
        .select('client_id, branch_id, organization_id')
        .eq('id', requestId)
        .single();

      // Update request status
      const { error: requestError } = await supabase
        .from('booking_change_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes
        })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // Update booking based on request type
      if (requestType === 'cancellation') {
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({
            status: 'cancelled',
            cancellation_request_status: null
          })
          .eq('id', bookingId);

        if (bookingError) throw bookingError;
      } else if (requestType === 'reschedule' && newDate && newTime) {
        // First, get the current booking to calculate duration
        const { data: currentBooking } = await supabase
          .from('bookings')
          .select('start_time, end_time')
          .eq('id', bookingId)
          .single();
        
        if (!currentBooking) throw new Error('Booking not found');
        
        // Calculate original duration in minutes
        const originalStart = new Date(currentBooking.start_time);
        const originalEnd = new Date(currentBooking.end_time);
        const durationMs = originalEnd.getTime() - originalStart.getTime();
        const durationMinutes = Math.floor(durationMs / (1000 * 60));
        
        // Create new start time
        const newStartTime = new Date(`${newDate}T${newTime}:00Z`);
        
        // Calculate new end time by adding the original duration
        const newEndTime = new Date(newStartTime.getTime() + (durationMinutes * 60 * 1000));
        
        console.log('[useApproveChangeRequest] Rescheduling booking:', {
          bookingId,
          originalStart: currentBooking.start_time,
          originalEnd: currentBooking.end_time,
          durationMinutes,
          newStart: newStartTime.toISOString(),
          newEnd: newEndTime.toISOString()
        });
        
        // Update both start and end times
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({
            start_time: newStartTime.toISOString(),
            end_time: newEndTime.toISOString(),
            reschedule_request_status: null
          })
          .eq('id', bookingId);

        if (bookingError) throw bookingError;
      }

      // Create notification for client
      if (requestData) {
        await supabase
          .from('notifications')
          .insert({
            title: 'Request Approved',
            message: `Your ${requestType} request has been approved by the admin.`,
            type: 'booking',
            category: 'success',
            priority: 'high',
            user_id: requestData.client_id,
            branch_id: requestData.branch_id,
            organization_id: requestData.organization_id,
            data: {
              booking_id: bookingId,
              request_id: requestId,
              admin_notes: adminNotes
            }
          });
      }

      return { requestId, bookingId };
    },
    onSuccess: () => {
      toast.success('Request approved successfully');
      
      // Invalidate ALL related queries for real-time sync
      queryClient.invalidateQueries({ queryKey: ['pending-booking-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-booking-requests-count'] });
      queryClient.invalidateQueries({ queryKey: ['client-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['branch-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['client-all-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['client-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['carer-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['carer-appointments-full'] });
      queryClient.invalidateQueries({ queryKey: ['organization-calendar'] });
      
      // Force refetch immediately
      queryClient.refetchQueries({ queryKey: ['branch-bookings'], type: 'active' });
    },
    onError: (error: Error) => {
      toast.error('Failed to approve request', {
        description: error.message
      });
    }
  });
};

// Reject request
export const useRejectChangeRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: RejectRequestParams) => {
      const { requestId, bookingId, requestType, adminNotes } = params;

      // Validate required parameters
      if (!requestId || !bookingId) {
        throw new Error("Missing required request or booking ID");
      }

      // Get request details for notification
      const { data: requestData } = await supabase
        .from('booking_change_requests')
        .select('client_id, branch_id, organization_id')
        .eq('id', requestId)
        .single();

      // Update request status
      const { error: requestError } = await supabase
        .from('booking_change_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes
        })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // Update booking to remove pending status
      const updateData: any = {};
      if (requestType === 'cancellation') {
        updateData.cancellation_request_status = 'rejected';
      } else {
        updateData.reschedule_request_status = 'rejected';
      }

      const { error: bookingError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (bookingError) throw bookingError;

      // Create notification for client
      if (requestData) {
        await supabase
          .from('notifications')
          .insert({
            title: 'Request Rejected',
            message: `Your ${requestType} request has been rejected. ${adminNotes}`,
            type: 'booking',
            category: 'warning',
            priority: 'high',
            user_id: requestData.client_id,
            branch_id: requestData.branch_id,
            organization_id: requestData.organization_id,
            data: {
              booking_id: bookingId,
              request_id: requestId,
              admin_notes: adminNotes
            }
          });
      }

      return { requestId, bookingId };
    },
    onSuccess: () => {
      toast.success('Request rejected');
      
      // Invalidate ALL related queries for real-time sync
      queryClient.invalidateQueries({ queryKey: ['pending-booking-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-booking-requests-count'] });
      queryClient.invalidateQueries({ queryKey: ['client-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['branch-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['client-all-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['client-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['carer-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['carer-appointments-full'] });
      queryClient.invalidateQueries({ queryKey: ['organization-calendar'] });
      
      // Force refetch immediately
      queryClient.refetchQueries({ queryKey: ['branch-bookings'], type: 'active' });
    },
    onError: (error: Error) => {
      toast.error('Failed to reject request', {
        description: error.message
      });
    }
  });
};
