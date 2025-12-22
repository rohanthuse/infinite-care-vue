import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ToggleStatusData {
  userId: string;
  currentStatus: 'active' | 'inactive';
}

export const useToggleOrganizationMemberStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ userId, currentStatus }: ToggleStatusData) => {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      console.log('[useToggleOrganizationMemberStatus] Toggling status:', { 
        userId, 
        currentStatus, 
        newStatus 
      });
      
      // Update organization_members status
      const { error: memberError } = await supabase
        .from('organization_members')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (memberError) {
        console.error('[useToggleOrganizationMemberStatus] Member update error:', memberError);
        throw memberError;
      }

      // Also update profiles status for consistency
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) {
        console.warn('[useToggleOrganizationMemberStatus] Profile update warning:', profileError);
        // Don't throw - profile update is secondary
      }

      return { success: true, newStatus };
    },
    onSuccess: (data) => {
      console.log('[useToggleOrganizationMemberStatus] Status toggled successfully');
      
      toast({
        title: "Status Updated",
        description: `Admin has been ${data.newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['branch-admins'] });
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      queryClient.invalidateQueries({ queryKey: ['organization-super-admins'] });
    },
    onError: (error: any) => {
      console.error('[useToggleOrganizationMemberStatus] Error:', error);
      
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });
};
