
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sanitizeFormData } from '@/utils/sanitizeText';

export interface CreateAssessmentData {
  client_id: string;
  assessment_name: string;
  assessment_type: string;
  assessment_date: string;
  performed_by: string;
  status: string;
  score?: number;
  results?: string;
  recommendations?: string;
  next_review_date?: string;
}

export const useCreateClientAssessment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAssessmentData) => {
      // Sanitize all text fields to prevent Unicode escape errors
      const sanitizedData = sanitizeFormData(data);
      
      const { data: result, error } = await supabase
        .from('client_assessments')
        .insert(sanitizedData)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-assessments', data.client_id] });
      toast.success('Assessment added successfully');
    },
    onError: (error) => {
      console.error('Error creating assessment:', error);
      toast.error('Failed to add assessment');
    },
  });
};
