
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UpdateCarePlanAssignmentData {
  carePlanId: string;
  staffId: string;
  providerName: string;
}

const updateCarePlanAssignment = async ({ carePlanId, staffId, providerName }: UpdateCarePlanAssignmentData) => {
  console.log(`[updateCarePlanAssignment] Updating care plan ${carePlanId} to assign to staff ${staffId}`);
  
  const { data, error } = await supabase
    .from('client_care_plans')
    .update({
      staff_id: staffId,
      provider_name: providerName,
      updated_at: new Date().toISOString()
    })
    .eq('id', carePlanId)
    .select()
    .single();

  if (error) {
    console.error('Error updating care plan assignment:', error);
    throw error;
  }

  return data;
};

export const useUpdateCarePlanAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCarePlanAssignment,
    onSuccess: async (updatedCarePlan) => {
      // Invalidate relevant queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['care-plan'] });
      queryClient.invalidateQueries({ queryKey: ['client-care-plans'] });
      queryClient.invalidateQueries({ queryKey: ['client-care-plans-with-details'] });
      queryClient.invalidateQueries({ queryKey: ['carer-assigned-care-plans'] });
      queryClient.invalidateQueries({ queryKey: ['care-plans'] });
      
      // Create notification for newly assigned staff
      try {
        const { data: clientData } = await supabase
          .from('clients')
          .select('first_name, last_name, branch_id')
          .eq('id', updatedCarePlan.client_id)
          .single();

        // Get staff auth_user_id for notification
        const { data: staffData } = await supabase
          .from('staff')
          .select('auth_user_id')
          .eq('id', updatedCarePlan.staff_id)
          .single();

        if (clientData && staffData?.auth_user_id) {
          const notification = {
            user_id: staffData.auth_user_id,
            branch_id: clientData.branch_id,
            type: 'care_plan',
            category: 'info',
            priority: 'medium',
            title: 'Care Plan Reassigned',
            message: `You have been assigned to ${updatedCarePlan.display_id || 'care plan'} for ${clientData.first_name} ${clientData.last_name}`,
            data: {
              care_plan_id: updatedCarePlan.id,
              action: updatedCarePlan.status === 'active' ? 'activation' : 'status_change',
              care_plan_title: updatedCarePlan.title || 'Care Plan',
              care_plan_display_id: updatedCarePlan.display_id,
              client_name: `${clientData.first_name} ${clientData.last_name}`
            }
          };

          await supabase.from('notifications').insert([notification]);
          console.log('[useUpdateCarePlan] Staff notification created for reassignment');
        } else {
          console.warn('[useUpdateCarePlan] Staff has no auth_user_id, cannot send notification');
        }
      } catch (notificationError) {
        console.error('[useUpdateCarePlan] Error creating staff notification:', notificationError);
        // Don't fail the operation for notification errors
      }
      
      toast.success('Care plan assignment updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update care plan assignment:', error);
      toast.error('Failed to update care plan assignment');
    },
  });
};
