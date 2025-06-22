
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SetPasswordData {
  staffId: string;
  newPassword: string;
}

interface AdminSetPasswordResponse {
  success: boolean;
  error?: string;
  message?: string;
  auth_user_id?: string;
}

export const useAdminSetPassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ staffId, newPassword }: SetPasswordData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      console.log('[useAdminSetPassword] Setting password for staff:', staffId);

      const { data, error } = await supabase.rpc('admin_set_staff_password', {
        p_staff_id: staffId,
        p_new_password: newPassword,
        p_admin_id: user.id
      });

      if (error) {
        console.error('[useAdminSetPassword] Error:', error);
        throw new Error(error.message || 'Failed to set password');
      }

      // Type guard to ensure data is an object with the expected structure
      const response = data as AdminSetPasswordResponse;
      
      if (!response || typeof response !== 'object' || !('success' in response)) {
        console.error('[useAdminSetPassword] Invalid response format:', data);
        throw new Error('Invalid response from server');
      }

      if (!response.success) {
        const errorMsg = response.error || 'Failed to set password';
        console.error('[useAdminSetPassword] Function returned error:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('[useAdminSetPassword] Password set successfully:', response);
      return response;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["branch-carers"] });
      
      toast.success("Password set successfully", {
        description: "The carer can now sign in with their new password."
      });
    },
    onError: (error: any) => {
      console.error('[useAdminSetPassword] Mutation error:', error);
      
      let errorMessage = "Failed to set password";
      let description = "An error occurred while setting the password.";
      
      if (error.message.includes('Insufficient permissions')) {
        errorMessage = "Access denied";
        description = "You don't have permission to set passwords for staff members.";
      } else if (error.message.includes('Staff member not found')) {
        errorMessage = "Staff member not found";
        description = "The specified staff member could not be found.";
      } else if (error.message.includes('Access denied')) {
        errorMessage = "Access denied";
        description = "You can only manage staff in your assigned branches.";
      } else if (error.message) {
        description = error.message;
      }
      
      toast.error(errorMessage, { description });
    }
  });
};
