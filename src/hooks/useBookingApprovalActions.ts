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
              full_name
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
            cancellation_request_status: 'approved'
          })
          .eq('id', bookingId);

        if (bookingError) throw bookingError;
      } else if (requestType === 'reschedule' && newDate && newTime) {
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({
            start_time: `${newDate}T${newTime}:00Z`,
            reschedule_request_status: 'approved'
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
      queryClient.invalidateQueries({ queryKey: ['pending-booking-requests'] });
      queryClient.invalidateQueries({ queryKey: ['client-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['branch-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['client-all-appointments'] });
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
      queryClient.invalidateQueries({ queryKey: ['pending-booking-requests'] });
      queryClient.invalidateQueries({ queryKey: ['client-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['branch-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['client-all-appointments'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to reject request', {
        description: error.message
      });
    }
  });
};
