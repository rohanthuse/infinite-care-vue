
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientRiskAssessment {
  id: string;
  client_id: string;
  risk_type: string;
  risk_level: string;
  risk_factors: string[];
  mitigation_strategies: string[];
  assessment_date: string;
  assessed_by: string;
  review_date?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const fetchClientRiskAssessments = async (clientId: string): Promise<ClientRiskAssessment[]> => {
  console.log('[fetchClientRiskAssessments] Fetching for client:', clientId);
  
  const { data, error } = await supabase
    .from('client_risk_assessments')
    .select('*')
    .eq('client_id', clientId)
    .order('assessment_date', { ascending: false });

  if (error) {
    console.error('[fetchClientRiskAssessments] Error:', error);
    throw error;
  }

  return data || [];
};

const createClientRiskAssessment = async (riskAssessment: Omit<ClientRiskAssessment, 'id' | 'created_at' | 'updated_at'>) => {
  console.log('[createClientRiskAssessment] Creating:', riskAssessment);
  
  const { data, error } = await supabase
    .from('client_risk_assessments')
    .insert(riskAssessment)
    .select()
    .single();

  if (error) {
    console.error('[createClientRiskAssessment] Error:', error);
    throw error;
  }

  return data;
};

const updateClientRiskAssessment = async ({ riskAssessmentId, updates }: { riskAssessmentId: string; updates: Partial<ClientRiskAssessment> }) => {
  console.log('[updateClientRiskAssessment] Updating:', { riskAssessmentId, updates });
  
  const { data, error } = await supabase
    .from('client_risk_assessments')
    .update(updates)
    .eq('id', riskAssessmentId)
    .select()
    .single();

  if (error) {
    console.error('[updateClientRiskAssessment] Error:', error);
    throw error;
  }

  return data;
};

export const useClientRiskAssessments = (clientId: string) => {
  return useQuery({
    queryKey: ['client-risk-assessments', clientId],
    queryFn: () => fetchClientRiskAssessments(clientId),
    enabled: Boolean(clientId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateClientRiskAssessment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createClientRiskAssessment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-risk-assessments', data.client_id] });
    },
  });
};

export const useUpdateClientRiskAssessment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateClientRiskAssessment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-risk-assessments', data.client_id] });
    },
  });
};
