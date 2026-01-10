
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sanitizeFormData } from '@/utils/sanitizeText';

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
  // Risk section
  rag_status?: string;
  has_pets?: boolean;
  fall_risk?: string;
  risk_to_staff?: string[];
  adverse_weather_plan?: string;
  // Personal Risk section
  lives_alone?: boolean;
  rural_area?: boolean;
  cared_in_bed?: boolean;
  smoker?: boolean;
  can_call_for_assistance?: boolean;
  communication_needs?: string;
  social_support?: string;
  fallen_past_six_months?: boolean;
  has_assistance_device?: boolean;
  arrange_assistance_device?: boolean;
}

export const useCreateClientRiskAssessment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRiskAssessmentData) => {
      // Sanitize all text fields including arrays to prevent Unicode escape errors
      const sanitizedData = sanitizeFormData(data);
      
      const { data: result, error } = await supabase
        .from('client_risk_assessments')
        .insert(sanitizedData)
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
