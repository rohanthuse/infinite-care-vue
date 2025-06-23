
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SetClientPasswordData {
  clientId: string;
  password: string;
}

export const useSetClientPassword = () => {
  const { session } = useAuth();

  return useMutation({
    mutationFn: async ({ clientId, password }: SetClientPasswordData) => {
      if (!session?.user?.id) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.rpc('admin_set_client_password', {
        p_client_id: clientId,
        p_new_password: password,
        p_admin_id: session.user.id
      });

      if (error) {
        console.error('Error setting client password:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to set password');
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success('Client password set successfully');
    },
    onError: (error: Error) => {
      console.error('Set client password error:', error);
      toast.error(error.message || 'Failed to set client password');
    },
  });
};
