import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCarerProfile } from './useCarerProfile';
import { toast } from 'sonner';

export const useCarerExtraTimeDelete = () => {
  const queryClient = useQueryClient();
  const { data: carerProfile } = useCarerProfile();

  const deleteExtraTime = useMutation({
    mutationFn: async (extraTimeId: string) => {
      if (!carerProfile?.id) {
        throw new Error('Carer profile not found');
      }

      // Verify the extra time belongs to this carer and is pending
      const { data: extraTime, error: fetchError } = await supabase
        .from('extra_time_records')
        .select('id, staff_id, status')
        .eq('id', extraTimeId)
        .single();

      if (fetchError) throw fetchError;
      if (!extraTime) throw new Error('Extra time record not found');
      if (extraTime.staff_id !== carerProfile.id) throw new Error('Unauthorized');
      if (extraTime.status !== 'pending') throw new Error('Only pending extra time records can be deleted');

      const { error } = await supabase
        .from('extra_time_records')
        .delete()
        .eq('id', extraTimeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-extra-time'] });
      queryClient.invalidateQueries({ queryKey: ['carer-payments'] });
      toast.success('Extra time record deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete extra time record', { description: error.message });
    },
  });

  return { deleteExtraTime };
};
