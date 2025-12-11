import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserRole } from './useUserRole';

interface EditMessageParams {
  messageId: string;
  threadId: string;
  content: string;
}

export const useEditMessage = () => {
  const queryClient = useQueryClient();
  const { data: currentUser } = useUserRole();

  return useMutation({
    mutationFn: async ({ messageId, threadId, content }: EditMessageParams) => {
      console.log('[useEditMessage] Editing message:', messageId);

      if (!currentUser) {
        throw new Error('Not authenticated');
      }

      // Update the message content and set is_edited to true
      const { error } = await supabase
        .from('messages')
        .update({
          content,
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', currentUser.id); // Only allow editing own messages

      if (error) throw error;
      return { messageId, threadId };
    },
    onSuccess: ({ threadId }) => {
      // Invalidate queries to refresh UI for real-time updates
      queryClient.invalidateQueries({ queryKey: ['unified-message-threads'] });
      queryClient.invalidateQueries({ queryKey: ['unified-thread-messages', threadId] });
      queryClient.invalidateQueries({ queryKey: ['admin-thread-messages', threadId] });
      queryClient.invalidateQueries({ queryKey: ['client-message-threads'] });
      queryClient.invalidateQueries({ queryKey: ['carer-message-contacts'] });
      
      toast.success('Message edited successfully');
    },
    onError: (error: any) => {
      console.error('[useEditMessage] Error:', error);
      toast.error(`Failed to edit message: ${error.message}`);
    }
  });
};
