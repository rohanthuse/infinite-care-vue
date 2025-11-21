import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getSystemSessionToken } from '@/utils/systemSession';

interface SetPasswordData {
  userId: string;
  newPassword: string;
}

interface AdminSetPasswordResponse {
  success: boolean;
  error?: string;
  message?: string;
  auth_user_id?: string;
}

export const useAdminSetSuperAdminPassword = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ userId, newPassword }: SetPasswordData) => {
      console.log('[useAdminSetSuperAdminPassword] Setting password for user:', userId);
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        throw new Error('Not authenticated');
      }

      const sessionToken = getSystemSessionToken();
      
      const { data, error } = await supabase.rpc('reset_system_user_password_with_session', {
        p_user_id: userId,
        p_new_password: newPassword,
        p_session_token: sessionToken || ''
      });

      if (error) {
        console.error('[useAdminSetSuperAdminPassword] RPC error:', error);
        throw error;
      }

      const response = data as unknown as AdminSetPasswordResponse;
      
      if (!response || !response.success) {
        throw new Error(response?.error || 'Failed to set password');
      }

      return response;
    },
    onSuccess: (data) => {
      console.log('[useAdminSetSuperAdminPassword] Password set successfully:', data);
      
      toast({
        title: "Success",
        description: "Super Admin password has been reset successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['organization-super-admins'] });
    },
    onError: (error: any) => {
      console.error('[useAdminSetSuperAdminPassword] Error:', error);
      
      let errorMessage = 'Failed to reset password. Please try again.';
      
      if (error.message?.includes('permission')) {
        errorMessage = 'You do not have permission to reset passwords';
      } else if (error.message?.includes('not found')) {
        errorMessage = 'User not found';
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};
