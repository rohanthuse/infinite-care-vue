import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Fetch all draft messages for current user
export const useDraftMessages = () => {
  return useQuery({
    queryKey: ['draft-messages'],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('draft_messages')
        .select('*')
        .eq('sender_id', userData.user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });
};

// Fetch all scheduled messages for current user
export const useScheduledMessages = () => {
  return useQuery({
    queryKey: ['scheduled-messages-all'],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('scheduled_messages')
        .select('*')
        .eq('sender_id', userData.user.id)
        .eq('status', 'pending')
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      return data || [];
    }
  });
};

// Delete draft message
export const useDeleteDraft = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (draftId: string) => {
      const { error } = await supabase
        .from('draft_messages')
        .delete()
        .eq('id', draftId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft-messages'] });
      toast.success('Draft deleted');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete draft: ${error.message}`);
    }
  });
};

// Cancel scheduled message
export const useCancelScheduledMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (messageId: string) => {
      // First fetch the message to get its details
      const { data: message, error: fetchError } = await supabase
        .from('scheduled_messages')
        .select('*')
        .eq('id', messageId)
        .single();

      if (fetchError) throw fetchError;

      // Update status to cancelled and set scheduled_for to current time to bypass future validation
      const { error } = await supabase
        .from('scheduled_messages')
        .update({ 
          status: 'cancelled',
          scheduled_for: new Date().toISOString() // Set to now to bypass trigger validation
        })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-messages-all'] });
      toast.success('Scheduled message cancelled successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to cancel message: ${error.message}`);
    }
  });
};
