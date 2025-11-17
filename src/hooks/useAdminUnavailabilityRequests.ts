import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReviewUnavailabilityRequest {
  requestId: string;
  status: 'approved' | 'rejected';
  adminNotes?: string;
}

// Fetch pending unavailability requests for admin
export const useAdminUnavailabilityRequests = (branchId?: string) => {
  return useQuery({
    queryKey: ['admin-unavailability-requests', branchId],
    queryFn: async () => {
      if (!branchId) return [];

      console.log('[useAdminUnavailabilityRequests] Fetching for branch:', branchId);

      const { data, error } = await supabase
        .from('booking_unavailability_requests')
        .select(`
          *,
          bookings (
            id,
            start_time,
            end_time,
            clients (
              id,
              first_name,
              last_name,
              email,
              phone
            ),
            services (
              title
            )
          ),
          staff (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('branch_id', branchId)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) {
        console.error('[useAdminUnavailabilityRequests] Error:', error);
        throw error;
      }

      console.log('[useAdminUnavailabilityRequests] Data:', data);
      return data;
    },
    enabled: !!branchId,
    staleTime: 30 * 1000 // 30 seconds
  });
};

// Review unavailability request (approve/reject)
export const useReviewUnavailability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (review: ReviewUnavailabilityRequest) => {
      console.log('[useReviewUnavailability] Reviewing request:', review);

      const { data: authData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('booking_unavailability_requests')
        .update({
          status: review.status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: authData.user?.id,
          admin_notes: review.adminNotes || null
        })
        .eq('id', review.requestId)
        .select()
        .single();

      if (error) {
        console.error('[useReviewUnavailability] Error:', error);
        throw error;
      }

      console.log('[useReviewUnavailability] Success:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-unavailability-requests'] });
      queryClient.invalidateQueries({ queryKey: ['branch-bookings'] });
      
      toast.success(
        data.status === 'approved' 
          ? 'Request approved' 
          : 'Request rejected',
        {
          description: data.status === 'approved'
            ? 'You can now reassign this booking to another carer.'
            : 'The carer has been notified of the rejection.'
        }
      );
    },
    onError: (error: any) => {
      console.error('[useReviewUnavailability] Failed:', error);
      toast.error('Failed to review request', {
        description: error.message
      });
    }
  });
};
