import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ReadReceipt {
  userId: string;
  userName: string;
  readAt: string | null;
}

interface MessageReadStatus {
  status: 'sent' | 'delivered' | 'partially_read' | 'all_read';
  readers: ReadReceipt[];
  totalRecipients: number;
  readCount: number;
}

export const useMessageReadReceipts = (messageId: string, threadId: string) => {
  return useQuery({
    queryKey: ['message-read-receipts', messageId, threadId],
    queryFn: async (): Promise<MessageReadStatus> => {
      // Get all participants in the thread (excluding the sender)
      const { data: participants, error: participantsError } = await supabase
        .from('message_participants')
        .select('user_id, user_name')
        .eq('thread_id', threadId);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        throw participantsError;
      }

      // Get read status for this message
      const { data: readStatuses, error: readError } = await supabase
        .from('message_read_status')
        .select('user_id, read_at')
        .eq('message_id', messageId);

      if (readError) {
        console.error('Error fetching read statuses:', readError);
        throw readError;
      }

      // Build the readers list
      const readers: ReadReceipt[] = (participants || []).map(participant => {
        const readStatus = readStatuses?.find(rs => rs.user_id === participant.user_id);
        return {
          userId: participant.user_id,
          userName: participant.user_name || 'Unknown',
          readAt: readStatus?.read_at || null
        };
      });

      const totalRecipients = readers.length;
      const readCount = readers.filter(r => r.readAt !== null).length;

      // Determine status
      let status: 'sent' | 'delivered' | 'partially_read' | 'all_read' = 'sent';
      
      if (totalRecipients === 0) {
        status = 'delivered';
      } else if (readCount === totalRecipients) {
        status = 'all_read';
      } else if (readCount > 0) {
        status = 'partially_read';
      } else {
        status = 'delivered';
      }

      return {
        status,
        readers,
        totalRecipients,
        readCount
      };
    },
    enabled: !!messageId && !!threadId,
    staleTime: 30000, // 30 seconds
  });
};
