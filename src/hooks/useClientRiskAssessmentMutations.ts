
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CreateRiskAssessmentData {
  client_id: string;
  risk_type: string;
  risk_level: string;
  assessment_date: string;
  assessed_by: string;
  status: string;
  risk_factors?: string[];
  mitigation_strategies?: string[];
  review_date?: string;
}

export const useCreateClientRiskAssessment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRiskAssessmentData) => {
      const { data: result, error } = await supabase
        .from('client_risk_assessments')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-risk-assessments', data.client_id] });
      toast.success('Risk assessment added successfully');
    },
    onError: (error) => {
      console.error('Error creating risk assessment:', error);
      toast.error('Failed to add risk assessment');
    },
  });
};
