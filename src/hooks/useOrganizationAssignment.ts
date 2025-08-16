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
    onSuccess: () => {
      toast.success('User assigned to organization successfully');
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
      queryClient.invalidateQueries({ queryKey: ['organizations-with-users'] });
      queryClient.invalidateQueries({ queryKey: ['organizations', 'system-tenants'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign user: ${error.message}`);
    }
  });
};