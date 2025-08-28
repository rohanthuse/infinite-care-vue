import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ThreadParticipant {
  id: string;
  name: string;
  type: string;
  userId: string;
}

export const useThreadParticipants = (threadId: string) => {
  return useQuery({
    queryKey: ['thread-participants', threadId],
    queryFn: async () => {
      if (!threadId) return [];

      const { data, error } = await supabase
        .from('message_participants')
        .select('user_id, user_name, user_type')
        .eq('thread_id', threadId);

      if (error) {
        console.error('Error fetching thread participants:', error);
        throw error;
      }

      return (data || []).map((participant, index) => ({
        id: `participant-${index}`,
        name: participant.user_name || 'Unknown User',
        type: participant.user_type || 'user',
        userId: participant.user_id
      }));
    },
    enabled: !!threadId
  });
};