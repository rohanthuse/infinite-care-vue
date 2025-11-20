import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getSystemSessionToken } from '@/utils/systemSession';

interface DeleteMultipleSystemUsersPayload {
  userIds: string[];
  users: Array<{
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role?: string;
    is_active: boolean;
  }>;
}

interface DeleteResult {
  successful: Array<{ id: string; name: string; email: string }>;
  failed: Array<{ id: string; name: string; email: string; error: string }>;
}

async function deleteMultipleSystemUsers(payload: DeleteMultipleSystemUsersPayload): Promise<DeleteResult> {
  const { userIds, users } = payload;
  const result: DeleteResult = {
    successful: [],
    failed: [],
  };

  const token = getSystemSessionToken();
  if (!token) {
    throw new Error('No system session found');
  }

  // Process deletions sequentially to handle errors properly
  for (const userId of userIds) {
    const user = users.find(u => u.id === userId);
    const userName = user ? `${user.first_name} ${user.last_name}` : 'Unknown User';
    const userEmail = user?.email || '';

    try {
      console.log(`[deleteMultipleSystemUsers] Deleting user ${userId} (${userName})`);
      
      const { data, error } = await supabase.rpc('delete_system_user_with_session', {
        p_user_id: userId,
        p_session_token: token,
      });

      if (error) {
        console.error(`[deleteMultipleSystemUsers] Error deleting ${userId}:`, error);
        result.failed.push({
          id: userId,
          name: userName,
          email: userEmail,
          error: error.message || 'Unknown error',
        });
        continue;
      }

      const response = data as { success: boolean; error?: string };
      if (!response?.success) {
        console.error(`[deleteMultipleSystemUsers] Delete failed for ${userId}:`, response?.error);
        result.failed.push({
          id: userId,
          name: userName,
          email: userEmail,
          error: response?.error || 'Delete operation failed',
        });
        continue;
      }

      result.successful.push({
        id: userId,
        name: userName,
        email: userEmail,
      });
    } catch (err) {
      console.error(`[deleteMultipleSystemUsers] Exception for ${userId}:`, err);
      result.failed.push({
        id: userId,
        name: userName,
        email: userEmail,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return result;
}

export const useDeleteMultipleSystemUsers = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteMultipleSystemUsers,
    
    onSuccess: async (result, variables) => {
      const { successful, failed } = result;
      const totalAttempted = variables.userIds.length;

      // Refetch to get latest data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['system-users'] }),
        queryClient.invalidateQueries({ queryKey: ['system-user-stats'] }),
      ]);

      // Show appropriate toast based on results
      if (successful.length === totalAttempted) {
        // All successful
        toast({
          title: "Success",
          description: `Successfully deleted ${successful.length} user${successful.length > 1 ? 's' : ''}.`,
          variant: "default",
        });
      } else if (successful.length === 0) {
        // All failed
        toast({
          title: "Error",
          description: `Failed to delete ${failed.length} user${failed.length > 1 ? 's' : ''}. ${failed[0]?.error || 'Please try again.'}`,
          variant: "destructive",
        });
      } else {
        // Partial success
        toast({
          title: "Partial Success",
          description: `Deleted ${successful.length} user${successful.length > 1 ? 's' : ''}, but ${failed.length} failed. Check console for details.`,
          variant: "default",
        });
        
        // Log details of failures for debugging
        console.warn('[useDeleteMultipleSystemUsers] Failed deletions:', failed);
      }
    },
    
    onError: (error: Error) => {
      console.error('[useDeleteMultipleSystemUsers] Mutation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete users. Please try again.",
        variant: "destructive",
      });
    },
  });
};
