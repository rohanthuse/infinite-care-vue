import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UpdateStatusData {
  memberId: string;
  userId: string;
  status: 'active' | 'inactive';
  isSystemUser: boolean;
}

export const useUpdateMemberStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ memberId, userId, status, isSystemUser }: UpdateStatusData) => {
      console.log('[useUpdateMemberStatus] Updating status:', { memberId, status, isSystemUser });
      
      if (isSystemUser) {
        // Update system_users table
        const { error: systemError } = await supabase
          .from('system_users')
          .update({ is_active: status === 'active' })
          .eq('id', userId);

        if (systemError) {
          console.error('[useUpdateMemberStatus] System user error:', systemError);
          throw systemError;
        }
      } else {
        // Update organization_members table
        const { error: memberError } = await supabase
          .from('organization_members')
          .update({ 
            status,
            updated_at: new Date().toISOString()
          })
          .eq('id', memberId);

        if (memberError) {
          console.error('[useUpdateMemberStatus] Member error:', memberError);
          throw memberError;
        }
      }

      return { success: true };
    },
    onSuccess: (_, variables) => {
      console.log('[useUpdateMemberStatus] Status updated successfully');
      
      toast({
        title: "Success",
        description: `Super Admin has been ${variables.status === 'active' ? 'activated' : 'inactivated'} successfully`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['organization-super-admins'] });
    },
    onError: (error: any) => {
      console.error('[useUpdateMemberStatus] Error:', error);
      
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });
};
