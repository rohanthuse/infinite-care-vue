import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserRole } from './useUserRole';

interface DeleteMessageParams {
  messageId: string;
  threadId: string;
}

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  const { data: currentUser } = useUserRole();

  return useMutation({
    mutationFn: async ({ messageId, threadId }: DeleteMessageParams) => {
      console.log('[useDeleteMessage] Deleting message:', messageId);

      // Soft delete the message
      const { error } = await supabase
        .from('messages')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: currentUser?.id
        })
        .eq('id', messageId);

      if (error) throw error;
      return { messageId, threadId };
    },
    onSuccess: ({ threadId }) => {
      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['unified-message-threads'] });
      queryClient.invalidateQueries({ queryKey: ['unified-thread-messages', threadId] });
      queryClient.invalidateQueries({ queryKey: ['admin-thread-messages', threadId] });
      queryClient.invalidateQueries({ queryKey: ['client-message-threads'] });
      queryClient.invalidateQueries({ queryKey: ['carer-message-contacts'] });
      
      toast.success('Message deleted successfully');
    },
    onError: (error: any) => {
      console.error('[useDeleteMessage] Error:', error);
      toast.error(`Failed to delete message: ${error.message}`);
    }
  });
};

export const useDeleteThread = () => {
  const queryClient = useQueryClient();
  const { data: currentUser } = useUserRole();

  return useMutation({
    mutationFn: async (threadId: string) => {
      console.log('[useDeleteThread] Deleting thread:', threadId);

      // Soft delete all messages in thread first
      const { error: messagesError } = await supabase
        .from('messages')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: currentUser?.id
        })
        .eq('thread_id', threadId);

      if (messagesError) throw messagesError;

      // Then soft delete the thread itself
      const { error: threadError } = await supabase
        .from('message_threads')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: currentUser?.id
        })
        .eq('id', threadId);

      if (threadError) throw threadError;
      return threadId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-message-threads'] });
      queryClient.invalidateQueries({ queryKey: ['client-message-threads'] });
      queryClient.invalidateQueries({ queryKey: ['carer-message-contacts'] });
      
      toast.success('Conversation deleted successfully');
    },
    onError: (error: any) => {
      console.error('[useDeleteThread] Error:', error);
      toast.error(`Failed to delete conversation: ${error.message}`);
    }
  });
};
