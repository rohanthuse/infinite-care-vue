
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SetClientPasswordParams {
  clientId: string;
  password: string;
  adminId: string;
}

const setClientPassword = async ({ clientId, password, adminId }: SetClientPasswordParams) => {
  console.log('[setClientPassword] Setting password for client:', clientId);
  
  const { data, error } = await supabase.rpc('admin_set_client_password', {
    p_client_id: clientId,
    p_new_password: password,
    p_admin_id: adminId
  });

  if (error) {
    console.error('[setClientPassword] Error:', error);
    throw error;
  }

  return data;
};

export const useAdminSetClientPassword = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: setClientPassword,
    onSuccess: (data) => {
      console.log('[useAdminSetClientPassword] Password set successfully:', data);
      
      if (data?.success) {
        toast({
          title: "Success",
          description: "Client password has been set successfully",
        });
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['branch-clients'] });
        queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      } else {
        toast({
          title: "Error",
          description: data?.error || "Failed to set client password",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('[useAdminSetClientPassword] Error:', error);
      toast({
        title: "Error",
        description: "Failed to set client password. Please try again.",
        variant: "destructive",
      });
    },
  });
};
