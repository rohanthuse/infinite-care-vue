import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCarerProfile } from './useCarerProfile';
import { toast } from 'sonner';

export const useCarerTravelDelete = () => {
  const queryClient = useQueryClient();
  const { data: carerProfile } = useCarerProfile();

  const deleteTravel = useMutation({
    mutationFn: async (travelId: string) => {
      if (!carerProfile?.id) {
        throw new Error('Carer profile not found');
      }

      // Verify the travel belongs to this carer and is pending
      const { data: travel, error: fetchError } = await supabase
        .from('travel_records')
        .select('id, staff_id, status')
        .eq('id', travelId)
        .single();

      if (fetchError) throw fetchError;
      if (!travel) throw new Error('Travel record not found');
      if (travel.staff_id !== carerProfile.id) throw new Error('Unauthorized');
      if (travel.status !== 'pending') throw new Error('Only pending travel records can be deleted');

      const { error } = await supabase
        .from('travel_records')
        .delete()
        .eq('id', travelId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-travel'] });
      queryClient.invalidateQueries({ queryKey: ['carer-payments'] });
      toast.success('Travel record deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete travel record', { description: error.message });
    },
  });

  return { deleteTravel };
};
