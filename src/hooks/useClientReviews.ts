
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClientReview {
  id: string;
  client_id: string;
  staff_id: string;
  appointment_id: string;
  service_date: string;
  rating: number;
  comment?: string;
  service_type: string;
  created_at: string;
  can_edit_until: string;
}

export interface CreateReviewData {
  client_id: string;
  staff_id: string;
  appointment_id: string;
  service_date: string;
  rating: number;
  comment?: string | null;
  service_type: string;
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

const checkExistingReview = async (clientId: string, appointmentId: string): Promise<ClientReview | null> => {
  if (!clientId || !appointmentId) {
    return null;
  }

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

  return data;
};

export const useClientReviews = (clientId: string) => {
  return useQuery({
    queryKey: ['client-reviews', clientId],
    queryFn: () => fetchClientReviews(clientId),
    enabled: Boolean(clientId),
  });
};

export const useCheckExistingReview = (clientId: string, appointmentId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['existing-review', clientId, appointmentId],
    queryFn: () => checkExistingReview(clientId, appointmentId),
    enabled: Boolean(clientId && appointmentId) && (options?.enabled !== false),
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (reviewData: CreateReviewData) => {
      const { data, error } = await supabase
        .from('reviews')
        .insert([reviewData])
        .select()
        .single();

      if (error) {
        console.error('Error creating review:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success('Review submitted successfully!');
      
      // Invalidate and refetch reviews
      queryClient.invalidateQueries({ queryKey: ['client-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['existing-review'] });
    },
    onError: (error) => {
      console.error('Failed to submit review:', error);
      toast.error('Failed to submit review. Please try again.');
    },
  });
};
