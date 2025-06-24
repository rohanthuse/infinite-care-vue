
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ClientReview {
  id: string;
  client_id: string;
  staff_id: string;
  appointment_id?: string;
  booking_id?: string;
  service_date: string;
  rating: number;
  comment?: string;
  service_type?: string;
  created_at: string;
  updated_at?: string; // Make this optional since it might not always be returned
  can_edit_until: string;
}

export interface CreateReviewData {
  client_id: string;
  staff_id: string;
  appointment_id?: string;
  booking_id?: string;
  service_date: string;
  rating: number;
  comment?: string;
  service_type?: string;
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

  return (data || []).map(review => ({
    ...review,
    updated_at: (review as any).updated_at || review.created_at // Safe access with fallback
  }));
};

const createReview = async (reviewData: CreateReviewData): Promise<ClientReview> => {
  console.log('[createReview] Creating review:', reviewData);

  const { data, error } = await supabase
    .from('reviews')
    .insert([reviewData])
    .select('*')
    .single();

  if (error) {
    console.error('Error creating review:', error);
    throw error;
  }

  return {
    ...data,
    updated_at: (data as any).updated_at || data.created_at // Safe access with fallback
  };
};

const updateReview = async (reviewId: string, updateData: UpdateReviewData): Promise<ClientReview> => {
  console.log('[updateReview] Updating review:', reviewId, updateData);

  const { data, error } = await supabase
    .from('reviews')
    .update(updateData)
    .eq('id', reviewId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating review:', error);
    throw error;
  }

  return {
    ...data,
    updated_at: (data as any).updated_at || data.created_at // Safe access with fallback
  };
};

const checkExistingReview = async (clientId: string, appointmentId: string): Promise<ClientReview | null> => {
  console.log('[checkExistingReview] Checking for existing review:', clientId, appointmentId);

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('client_id', clientId)
    .eq('appointment_id', appointmentId)
    .maybeSingle();

  if (error) {
    console.error('Error checking existing review:', error);
    throw error;
  }

  if (!data) return null;

  return {
    ...data,
    updated_at: (data as any).updated_at || data.created_at // Safe access with fallback
  };
};

export const useClientReviews = (clientId: string) => {
  return useQuery({
    queryKey: ['client-reviews', clientId],
    queryFn: () => fetchClientReviews(clientId),
    enabled: Boolean(clientId),
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createReview,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-reviews', data.client_id] });
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback! Your review has been submitted successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Error creating review:', error);
      toast({
        title: "Error submitting review",
        description: error.message || "Failed to submit your review. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ reviewId, updateData }: { reviewId: string; updateData: UpdateReviewData }) =>
      updateReview(reviewId, updateData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-reviews', data.client_id] });
      toast({
        title: "Review updated",
        description: "Your review has been updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Error updating review:', error);
      toast({
        title: "Error updating review",
        description: error.message || "Failed to update your review. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useCheckExistingReview = (clientId: string, appointmentId: string) => {
  return useQuery({
    queryKey: ['existing-review', clientId, appointmentId],
    queryFn: () => checkExistingReview(clientId, appointmentId),
    enabled: Boolean(clientId && appointmentId),
  });
};
