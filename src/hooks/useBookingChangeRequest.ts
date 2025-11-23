import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubmitCancellationRequestParams {
  bookingId: string;
  clientId: string;
  branchId: string;
  organizationId?: string;
  reason: string;
  notes?: string;
}

interface SubmitRescheduleRequestParams {
  bookingId: string;
  clientId: string;
  branchId: string;
  organizationId?: string;
  reason: string;
  newDate: Date;
  newTime: string;
  notes?: string;
}

// Submit cancellation request
export function useSubmitCancellationRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SubmitCancellationRequestParams) => {
      console.log('[useSubmitCancellationRequest] Submitting cancellation request:', params);

      // Create the change request
      const { data: request, error: requestError } = await supabase
        .from('booking_change_requests')
        .insert({
          booking_id: params.bookingId,
          client_id: params.clientId,
          branch_id: params.branchId,
          organization_id: params.organizationId,
          request_type: 'cancellation',
          reason: params.reason,
          notes: params.notes,
          status: 'pending',
        })
        .select()
        .single();

      if (requestError) {
        console.error('[useSubmitCancellationRequest] Request creation error:', requestError);
        throw requestError;
      }

      // Update the booking status to indicate pending cancellation
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ cancellation_request_status: 'pending' })
        .eq('id', params.bookingId);

      if (bookingError) {
        console.error('[useSubmitCancellationRequest] Booking update error:', bookingError);
        throw bookingError;
      }

      // Create notification for admin
      await supabase
        .from('notifications')
        .insert({
          title: '🔴 New Cancellation Request',
          message: `New cancellation request received from client`,
          type: 'booking',
          category: 'info',
          priority: 'high',
          branch_id: params.branchId,
          organization_id: params.organizationId,
          user_id: params.clientId,
          data: {
            booking_id: params.bookingId,
            client_id: params.clientId,
            request_type: 'cancellation',
            request_id: request.id
          }
        });

      console.log('[useSubmitCancellationRequest] Success:', request);
      return request;
    },
    onSuccess: (data, variables) => {
      toast.success('Cancellation Request Submitted', {
        description: 'Your cancellation request has been submitted for review.',
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['client-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['client-all-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['booking-change-requests', variables.clientId] });
    },
    onError: (error: any) => {
      console.error('[useSubmitCancellationRequest] Error:', error);
      toast.error('Failed to Submit Request', {
        description: error.message || 'Could not submit cancellation request.',
      });
    },
  });
}

// Submit reschedule request
export function useSubmitRescheduleRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SubmitRescheduleRequestParams) => {
      console.log('[useSubmitRescheduleRequest] Submitting reschedule request:', params);

      // Format the new time for database
      const formattedDate = params.newDate.toISOString().split('T')[0];
      const formattedTime = params.newTime;

      // Create the change request
      const { data: request, error: requestError } = await supabase
        .from('booking_change_requests')
        .insert({
          booking_id: params.bookingId,
          client_id: params.clientId,
          branch_id: params.branchId,
          organization_id: params.organizationId,
          request_type: 'reschedule',
          reason: params.reason,
          new_date: formattedDate,
          new_time: formattedTime,
          notes: params.notes,
          status: 'pending',
        })
        .select()
        .single();

      if (requestError) {
        console.error('[useSubmitRescheduleRequest] Request creation error:', requestError);
        throw requestError;
      }

      // Update the booking status to indicate pending reschedule
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ reschedule_request_status: 'pending' })
        .eq('id', params.bookingId);

      if (bookingError) {
        console.error('[useSubmitRescheduleRequest] Booking update error:', bookingError);
        throw bookingError;
      }

      // Create notification for admin
      await supabase
        .from('notifications')
        .insert({
          title: '🟠 New Reschedule Request',
          message: `New reschedule request received - Requested date: ${formattedDate} at ${formattedTime}`,
          type: 'booking',
          category: 'info',
          priority: 'high',
          branch_id: params.branchId,
          organization_id: params.organizationId,
          user_id: params.clientId,
          data: {
            booking_id: params.bookingId,
            client_id: params.clientId,
            request_type: 'reschedule',
            request_id: request.id,
            new_date: formattedDate,
            new_time: formattedTime
          }
        });

      console.log('[useSubmitRescheduleRequest] Success:', request);
      return request;
    },
    onSuccess: (data, variables) => {
      toast.success('Reschedule Request Submitted', {
        description: 'Your reschedule request has been submitted for review.',
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['client-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['client-all-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['booking-change-requests', variables.clientId] });
    },
    onError: (error: any) => {
      console.error('[useSubmitRescheduleRequest] Error:', error);
      toast.error('Failed to Submit Request', {
        description: error.message || 'Could not submit reschedule request.',
      });
    },
  });
}

// Fetch client's change requests
export function useClientChangeRequests(clientId?: string) {
  return useQuery({
    queryKey: ['booking-change-requests', clientId],
    queryFn: async () => {
      if (!clientId) return [];

      console.log('[useClientChangeRequests] Fetching change requests for client:', clientId);

      const { data, error } = await supabase
        .from('booking_change_requests')
        .select(
          `
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
            )
          )
        `
        )
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useClientChangeRequests] Error:', error);
        throw error;
      }

      console.log('[useClientChangeRequests] Fetched requests:', data?.length || 0);
      return data || [];
    },
    enabled: Boolean(clientId),
  });
}
