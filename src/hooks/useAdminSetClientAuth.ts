
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
  user_created?: boolean;
  client_linked?: boolean;
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
      
      // Provide detailed success feedback
      const message = data.user_created 
        ? "New authentication account created and linked successfully"
        : "Existing authentication account updated and linked successfully";
      
      toast({
        title: "Success",
        description: `${message}. The client can now log in using their email and password.`,
      });
      
      // Invalidate relevant queries to refresh client data
      queryClient.invalidateQueries({ queryKey: ['branch-clients'] });
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      queryClient.invalidateQueries({ queryKey: ['client-details'] });
    },
    onError: (error: any) => {
      console.error('[useAdminSetClientAuth] Error:', error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to set up client authentication. Please try again.";
      
      if (error.message?.includes('Insufficient permissions')) {
        errorMessage = "You don't have permission to set up client authentication.";
      } else if (error.message?.includes('Client not found')) {
        errorMessage = "Client not found. Please refresh the page and try again.";
      } else if (error.message?.includes('already exists')) {
        errorMessage = "Authentication account already exists. Trying to update existing account.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};
