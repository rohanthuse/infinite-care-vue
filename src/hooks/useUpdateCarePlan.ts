
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
    onSuccess: () => {
      // Invalidate relevant queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['care-plan'] });
      queryClient.invalidateQueries({ queryKey: ['client-care-plans'] });
      queryClient.invalidateQueries({ queryKey: ['client-care-plans-with-details'] });
      queryClient.invalidateQueries({ queryKey: ['carer-assigned-care-plans'] });
      queryClient.invalidateQueries({ queryKey: ['care-plans'] });
      
      toast.success('Care plan assignment updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update care plan assignment:', error);
      toast.error('Failed to update care plan assignment');
    },
  });
};
