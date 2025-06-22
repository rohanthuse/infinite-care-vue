
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface SetPasswordData {
  staffId: string;
  password: string;
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
      
      if (data && !data.success) {
        throw new Error(data.error || 'Failed to set password');
      }
      
      return data;
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
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('generate_temporary_password');
      
      if (error) throw error;
      return data;
    },
    onError: (error: any) => {
      console.error('Error generating temporary password:', error);
      toast.error('Failed to generate password', {
        description: error.message || 'An error occurred while generating the password.'
      });
    }
  });
};
