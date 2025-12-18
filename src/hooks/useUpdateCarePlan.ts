import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { syncCarePlanStaffAssignments, sendStaffAssignmentNotifications } from './useCarePlanStaffAssignments';

interface UpdateCarePlanAssignmentData {
  carePlanId: string;
  staffIds?: string[];
  providerName: string;
  // Keep backward compatibility
  staffId?: string;
}

const updateCarePlanAssignment = async ({ carePlanId, staffIds, providerName, staffId }: UpdateCarePlanAssignmentData) => {
  console.log(`[updateCarePlanAssignment] Updating care plan ${carePlanId} with staff:`, staffIds);
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Use staffIds array, falling back to single staffId for backward compatibility
  const effectiveStaffIds = staffIds && staffIds.length > 0 ? staffIds : (staffId ? [staffId] : []);
  const primaryStaffId = effectiveStaffIds[0] || null;

  // Update the care plan with primary staff_id for backward compatibility
  const { data, error } = await supabase
    .from('client_care_plans')
    .update({
      staff_id: primaryStaffId,
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

  // Sync staff assignments to junction table
  if (effectiveStaffIds.length > 0) {
    const { added, removed } = await syncCarePlanStaffAssignments(
      carePlanId,
      effectiveStaffIds,
      user.id
    );

    // Get unchanged staff for update notifications
    const unchangedStaff = effectiveStaffIds.filter(id => !added.includes(id));

    // Send notifications
    await sendStaffAssignmentNotifications(
      carePlanId,
      data.client_id,
      added,
      removed,
      unchangedStaff,
      data.title || 'Care Plan',
      data.display_id || '',
      true // Notify unchanged staff about the update
    );
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
      queryClient.invalidateQueries({ queryKey: ['carer-assigned-care-plans-optimized'] });
      queryClient.invalidateQueries({ queryKey: ['care-plans'] });
      queryClient.invalidateQueries({ queryKey: ['care-plan-staff-assignments'] });
      
      toast.success('Care plan assignment updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update care plan assignment:', error);
      toast.error('Failed to update care plan assignment');
    },
  });
};
