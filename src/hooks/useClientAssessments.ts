
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientAssessment {
  id: string;
  client_id: string;
  assessment_type: string;
  assessment_name: string;
  assessment_date: string;
  performed_by: string;
  status: string;
  results?: string;
  score?: number;
  recommendations?: string;
  next_review_date?: string;
  care_plan_id?: string;
  performed_by_id?: string;
  created_at: string;
  updated_at: string;
}

const fetchClientAssessments = async (clientId: string): Promise<ClientAssessment[]> => {
  console.log('[fetchClientAssessments] Fetching for client:', clientId);
  
  const { data, error } = await supabase
    .from('client_assessments')
    .select(`
      *,
      care_plan:client_care_plans(title),
      performer:profiles!performed_by_id(first_name, last_name)
    `)
    .eq('client_id', clientId)
    .order('assessment_date', { ascending: false });

  if (error) {
    console.error('[fetchClientAssessments] Error:', error);
    throw error;
  }

  return data || [];
};

const createClientAssessment = async (assessment: Omit<ClientAssessment, 'id' | 'created_at' | 'updated_at'>) => {
  console.log('[createClientAssessment] Creating:', assessment);
  
  const { data, error } = await supabase
    .from('client_assessments')
    .insert({
      ...assessment,
      performed_by_id: assessment.performed_by_id || (await supabase.auth.getUser()).data.user?.id
    })
    .select()
    .single();

  if (error) {
    console.error('[createClientAssessment] Error:', error);
    throw error;
  }

  return data;
};

const updateClientAssessment = async (id: string, assessment: Partial<ClientAssessment>) => {
  console.log('[updateClientAssessment] Updating:', id, assessment);
  
  const { data, error } = await supabase
    .from('client_assessments')
    .update(assessment)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[updateClientAssessment] Error:', error);
    throw error;
  }

  return data;
};

export const useClientAssessments = (clientId: string) => {
  return useQuery({
    queryKey: ['client-assessments', clientId],
    queryFn: () => fetchClientAssessments(clientId),
    enabled: Boolean(clientId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateClientAssessment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createClientAssessment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-assessments', data.client_id] });
    },
  });
};

export const useUpdateClientAssessment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...assessment }: { id: string } & Partial<ClientAssessment>) => 
      updateClientAssessment(id, assessment),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-assessments', data.client_id] });
    },
  });
};
