
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClientReview {
  id: string;
  client_id: string;
  staff_id: string;
  booking_id: string; // Changed from appointment_id to booking_id
  service_date: string;
  rating: number;
  comment?: string;
  service_type: string;
  created_at: string;
  can_edit_until: string;
  branch_id?: string; // Add branch_id to the interface
}

export interface CreateReviewData {
  client_id: string;
  staff_id: string | null;
  booking_id: string; // Changed from appointment_id to booking_id
  service_date: string;
  rating: number;
  comment?: string | null;
  service_type: string;
  branch_id?: string; // Add branch_id to creation data
}

export interface UpdateReviewData {
  rating: number;
  comment?: string;
}

const fetchClientReviews = async (clientId: string): Promise<ClientReview[]> => {
  if (!clientId) {
    console.error('[fetchClientReviews] No client ID provided');
    return [];
  }

  console.log(`[fetchClientReviews] Fetching reviews for client: ${clientId}`);

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching client reviews:', error);
    throw error;
  }

  return data || [];
};

const checkExistingReview = async (clientId: string, bookingId: string): Promise<ClientReview | null> => {
  if (!clientId || !bookingId) {
    return null;
  }

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('client_id', clientId)
    .eq('booking_id', bookingId) // Changed from appointment_id to booking_id
    .maybeSingle();

  if (error) {
    console.error('Error checking existing review:', error);
    throw error;
  }

  return data;
};

export const useClientReviews = (clientId: string) => {
  return useQuery({
    queryKey: ['client-reviews', clientId],
    queryFn: () => fetchClientReviews(clientId),
    enabled: Boolean(clientId),
  });
};

export const useCheckExistingReview = (clientId: string, bookingId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['existing-review', clientId, bookingId], // Changed from appointmentId to bookingId
    queryFn: () => checkExistingReview(clientId, bookingId),
    enabled: Boolean(clientId && bookingId) && (options?.enabled !== false),
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (reviewData: CreateReviewData) => {
      console.log('[useCreateReview] Creating review with data:', reviewData);
      
      const { data, error } = await supabase
        .from('reviews')
        .insert([reviewData])
        .select()
        .single();

      if (error) {
        console.error('Error creating review:', error);
        throw error;
      }

      console.log('[useCreateReview] Review created successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      toast.success('Review submitted successfully!');
      
      // Invalidate and refetch reviews
      queryClient.invalidateQueries({ queryKey: ['client-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['existing-review'] });
      // Also invalidate branch reviews so admin can see the new review
      queryClient.invalidateQueries({ queryKey: ['branch-reviews'] });
    },
    onError: (error) => {
      console.error('Failed to submit review:', error);
      toast.error('Failed to submit review. Please try again.');
    },
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ reviewId, updateData }: { reviewId: string; updateData: UpdateReviewData }) => {
      const { data, error } = await supabase
        .from('reviews')
        .update(updateData)
        .eq('id', reviewId)
        .select()
        .single();

      if (error) {
        console.error('Error updating review:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success('Review updated successfully!');
      
      // Invalidate and refetch reviews
      queryClient.invalidateQueries({ queryKey: ['client-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['existing-review'] });
      // Also invalidate branch reviews so admin can see the updated review
      queryClient.invalidateQueries({ queryKey: ['branch-reviews'] });
    },
    onError: (error) => {
      console.error('Failed to update review:', error);
      toast.error('Failed to update review. Please try again.');
    },
  });
};
