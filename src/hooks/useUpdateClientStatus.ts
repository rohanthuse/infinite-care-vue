import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdminUpdateClient } from './useAdminClientData';
import { toast } from '@/hooks/use-toast';

interface UpdateClientStatusParams {
  clientId: string;
  newStatus: string;
}

export const useUpdateClientStatus = () => {
  const queryClient = useQueryClient();
  const updateClientMutation = useAdminUpdateClient();
  
  return useMutation({
    mutationFn: async ({ clientId, newStatus }: UpdateClientStatusParams) => {
      return updateClientMutation.mutateAsync({
        clientId,
        updates: { status: newStatus }
      });
    },
    onSuccess: () => {
      // Invalidate all client-related queries
      queryClient.invalidateQueries({ queryKey: ['branch-clients'] });
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      toast({
        title: "Success",
        description: "Client status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message}`,
        variant: "destructive",
      });
    }
  });
};
