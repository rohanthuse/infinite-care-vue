import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UpdateScheduledMessageParams {
  messageId: string;
  updates: {
    subject?: string | null;
    content: string;
    recipient_ids: string[];
    scheduled_for: string;
    message_type: string;
    priority: 'low' | 'medium' | 'high';
    action_required: boolean;
    admin_eyes_only: boolean;
    notification_methods: string[];
    other_email_address?: string | null;
    attachments?: any[];
  };
}

export const useEditScheduledMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, updates }: UpdateScheduledMessageParams) => {
      const { data, error } = await supabase
        .from('scheduled_messages')
        .update({
          ...updates,
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
      toast.success('Scheduled message updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update scheduled message: ${error.message}`);
    }
  });
};
