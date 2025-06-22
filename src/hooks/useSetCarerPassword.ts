
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface SetPasswordData {
  staffId: string;
  password: string;
}

interface DatabaseResponse {
  success: boolean;
  error?: string;
  message?: string;
  auth_user_id?: string;
}

export const useSetCarerPassword = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ staffId, password }: SetPasswordData) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase.rpc('admin_set_staff_password', {
        p_staff_id: staffId,
        p_new_password: password,
        p_admin_id: user.id
      });

      if (error) throw error;
      
      const response = data as DatabaseResponse;
      
      if (response && !response.success) {
        throw new Error(response.error || 'Failed to set password');
      }
      
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['branch-carers'] });
      toast.success('Password set successfully', {
        description: 'The carer can now log in with the new password.'
      });
    },
    onError: (error: any) => {
      console.error('Error setting carer password:', error);
      toast.error('Failed to set password', {
        description: error.message || 'An error occurred while setting the password.'
      });
    }
  });
};

export const useGenerateTemporaryPassword = () => {
  return useMutation({
    mutationFn: async (): Promise<string> => {
      const { data, error } = await supabase.rpc('generate_temporary_password');
      
      if (error) throw error;
      return data as string;
    },
    onError: (error: any) => {
      console.error('Error generating temporary password:', error);
      toast.error('Failed to generate password', {
        description: error.message || 'An error occurred while generating the password.'
      });
    }
  });
};
