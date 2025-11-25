import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UpdateScheduledMessageParams {
  messageId: string;
  scheduled_for: string;
}

export const useEditScheduledMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, scheduled_for }: UpdateScheduledMessageParams) => {
      const { data, error } = await supabase
        .from('scheduled_messages')
        .update({
          scheduled_for,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('status', 'pending')
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-messages-all'] });
      toast.success('Schedule updated successfully.');
    },
    onError: (error: any) => {
      toast.error(`Failed to update schedule: ${error.message}`);
    }
  });
};
