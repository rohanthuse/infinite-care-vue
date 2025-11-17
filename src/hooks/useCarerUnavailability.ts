import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UnavailabilityRequest {
  booking_id: string;
  staff_id: string;
  branch_id: string;
  reason: string;
  notes?: string;
}

interface UnavailabilityRequestRecord {
  id: string;
  booking_id: string;
  staff_id: string;
  branch_id: string;
  reason: string;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'reassigned';
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  admin_notes: string | null;
  bookings?: {
    start_time: string;
    end_time: string;
    clients: {
      first_name: string;
      last_name: string;
    };
  };
}

// Submit unavailability request
export const useSubmitUnavailability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: UnavailabilityRequest) => {
      console.log('[useSubmitUnavailability] Submitting request:', request);

      const { data, error } = await supabase
        .from('booking_unavailability_requests')
        .insert({
          booking_id: request.booking_id,
          staff_id: request.staff_id,
          branch_id: request.branch_id,
          reason: request.reason,
          notes: request.notes || null,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('[useSubmitUnavailability] Error:', error);
        throw error;
      }

      console.log('[useSubmitUnavailability] Success:', data);
      return data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['carer-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['carer-appointments-full'] });
      queryClient.invalidateQueries({ queryKey: ['carer-unavailability-requests'] });
      
      toast.success('Unavailability request submitted', {
        description: 'An administrator will review your request and reassign the booking if approved.'
      });
    },
    onError: (error: any) => {
      console.error('[useSubmitUnavailability] Failed:', error);
      toast.error('Failed to submit request', {
        description: error.message || 'Please try again or contact support.'
      });
    }
  });
};

// Fetch carer's unavailability requests
export const useCarerUnavailabilityRequests = (staffId?: string) => {
  return useQuery({
    queryKey: ['carer-unavailability-requests', staffId],
    queryFn: async () => {
      if (!staffId) return [];

      console.log('[useCarerUnavailabilityRequests] Fetching for staff:', staffId);

      const { data, error } = await supabase
        .from('booking_unavailability_requests')
        .select(`
          *,
          bookings (
            start_time,
            end_time,
            clients (
              first_name,
              last_name
            )
          )
        `)
        .eq('staff_id', staffId)
        .order('requested_at', { ascending: false });

      if (error) {
        console.error('[useCarerUnavailabilityRequests] Error:', error);
        throw error;
      }

      console.log('[useCarerUnavailabilityRequests] Data:', data);
      return data as UnavailabilityRequestRecord[];
    },
    enabled: !!staffId,
    staleTime: 60 * 1000 // 1 minute
  });
};
