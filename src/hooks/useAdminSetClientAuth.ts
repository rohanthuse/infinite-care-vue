
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SetupClientAuthParams {
  clientId: string;
  password: string;
  adminId: string;
}

interface AdminSetupClientAuthResponse {
  success: boolean;
  error?: string;
  message?: string;
  auth_user_id?: string;
}

const setupClientAuth = async ({ clientId, password, adminId }: SetupClientAuthParams): Promise<AdminSetupClientAuthResponse> => {
  console.log('[setupClientAuth] Setting up auth for client:', clientId);
  
  try {
    // Call the edge function to handle client authentication setup
    const { data, error } = await supabase.functions.invoke('setup-client-auth', {
      body: {
        clientId,
        password,
        adminId
      }
    });

    if (error) {
      console.error('[setupClientAuth] Edge function error:', error);
      throw new Error(error.message || 'Failed to setup client authentication');
    }

    if (!data?.success) {
      console.error('[setupClientAuth] Setup failed:', data?.error);
      throw new Error(data?.error || 'Authentication setup failed');
    }

    console.log('[setupClientAuth] Authentication setup successful:', data);
    return data;

  } catch (error: any) {
    console.error('[setupClientAuth] Error:', error);
    throw error;
  }
};

export const useAdminSetClientAuth = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: setupClientAuth,
    onSuccess: (data) => {
      console.log('[useAdminSetClientAuth] Auth setup successful:', data);
      
      toast({
        title: "Success",
        description: "Client authentication has been set up successfully",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['branch-clients'] });
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
    },
    onError: (error: any) => {
      console.error('[useAdminSetClientAuth] Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to set up client authentication. Please try again.",
        variant: "destructive",
      });
    },
  });
};
