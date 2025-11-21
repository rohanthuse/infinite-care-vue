import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UpdateMemberData {
  memberId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  organizationId: string;
}

export const useUpdateOrganizationMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: UpdateMemberData) => {
      console.log('[useUpdateOrganizationMember] Updating member:', data);
      
      const { data: result, error } = await supabase.functions.invoke('update-organization-member', {
        body: data
      });

      if (error) {
        console.error('[useUpdateOrganizationMember] Error:', error);
        throw error;
      }

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to update member');
      }

      return result;
    },
    onSuccess: () => {
      console.log('[useUpdateOrganizationMember] Member updated successfully');
      
      toast({
        title: "Success",
        description: "Super Admin details have been updated successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ["organization-super-admins"] });
    },
    onError: (error: any) => {
      console.error('[useUpdateOrganizationMember] Error:', error);
      
      const errorMessage = error.message || 'Failed to update member';
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};
