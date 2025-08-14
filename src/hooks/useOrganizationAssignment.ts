import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AssignUserToOrganizationData {
  systemUserId: string;
  organizationId: string;
  role: string;
}

const assignUserToOrganization = async (data: AssignUserToOrganizationData) => {
  const { data: result, error } = await supabase.functions.invoke('assign-user-to-organization', {
    body: {
      system_user_id: data.systemUserId,
      organization_id: data.organizationId,
      role: data.role
    }
  });

  if (error) {
    throw new Error(error.message || 'Failed to assign user to organization');
  }

  if (!result?.success) {
    throw new Error(result?.error || 'Failed to assign user to organization');
  }

  return result;
};

export const useAssignUserToOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignUserToOrganization,
    onSuccess: (result, variables) => {
      console.log('[useOrganizationAssignment] User assignment successful, invalidating queries');
      
      toast.success('User assigned to organization successfully');
      
      // Comprehensive cache invalidation to ensure UI updates
      Promise.all([
        // Invalidate system users data
        queryClient.invalidateQueries({ queryKey: ['system-users'] }),
        
        // Invalidate organizations with users data
        queryClient.invalidateQueries({ queryKey: ['organizations-with-users'] }),
        
        // Invalidate system user stats
        queryClient.invalidateQueries({ queryKey: ['system-user-stats'] }),
        
        // Force refetch to ensure fresh data
        queryClient.refetchQueries({ queryKey: ['organizations-with-users'] }),
        queryClient.refetchQueries({ queryKey: ['system-users'] })
      ]).then(() => {
        console.log('[useOrganizationAssignment] All queries invalidated and refetched');
      }).catch((error) => {
        console.error('[useOrganizationAssignment] Error during cache invalidation:', error);
      });
    },
    onError: (error: Error) => {
      console.error('[useOrganizationAssignment] Assignment failed:', error);
      toast.error(`Failed to assign user: ${error.message}`);
    }
  });
};