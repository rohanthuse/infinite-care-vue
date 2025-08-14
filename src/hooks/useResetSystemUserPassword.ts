import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getSystemSessionToken } from "@/utils/systemSession";

interface ResetSystemUserPasswordData {
  userId: string;
  newPassword: string;
}

interface ResetSystemUserPasswordResponse {
  success: boolean;
  error?: string;
  message?: string;
  auth_user_id?: string;
}

export const useResetSystemUserPassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, newPassword }: ResetSystemUserPasswordData) => {
      const sessionToken = getSystemSessionToken();
      if (!sessionToken) throw new Error('Not authenticated');

      console.log('[useResetSystemUserPassword] Resetting password for user:', userId);

      const { data, error } = await supabase.rpc('reset_system_user_password_with_session', {
        p_user_id: userId,
        p_new_password: newPassword,
        p_session_token: sessionToken
      });

      if (error) {
        console.error('[useResetSystemUserPassword] Error:', error);
        throw new Error(error.message || 'Failed to reset password');
      }

      // Safe type conversion: Json -> unknown -> ResetSystemUserPasswordResponse
      const response = data as unknown as ResetSystemUserPasswordResponse;
      
      if (!response || typeof response !== 'object' || !('success' in response)) {
        console.error('[useResetSystemUserPassword] Invalid response format:', data);
        throw new Error('Invalid response from server');
      }

      if (!response.success) {
        const errorMsg = response.error || 'Failed to reset password';
        console.error('[useResetSystemUserPassword] Function returned error:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('[useResetSystemUserPassword] Password reset successfully:', response);
      return response;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["system-users"] });
      queryClient.invalidateQueries({ queryKey: ["system-user-stats"] });
      
      toast.success("Password reset successfully", {
        description: "The system user can now sign in with their new password."
      });
    },
    onError: (error: any) => {
      console.error('[useResetSystemUserPassword] Mutation error:', error);
      
      let errorMessage = "Failed to reset password";
      let description = "An error occurred while resetting the password.";
      
      if (error.message.includes('Insufficient permissions')) {
        errorMessage = "Access denied";
        description = "You don't have permission to reset passwords for system users.";
      } else if (error.message.includes('System user not found')) {
        errorMessage = "User not found";
        description = "The specified system user could not be found.";
      } else if (error.message.includes('Auth user not found')) {
        errorMessage = "Authentication error";
        description = "No authentication record found for this system user.";
      } else if (error.message) {
        description = error.message;
      }
      
      toast.error(errorMessage, { description });
    }
  });
};