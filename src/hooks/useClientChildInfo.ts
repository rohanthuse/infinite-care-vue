import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientChildInfo {
  id: string;
  client_id: string;
  legal_status: 'care_order' | 'voluntary' | 'other' | null;
  legal_status_other: string | null;
  social_worker_name: string | null;
  social_worker_contact: string | null;
  social_worker_email: string | null;
  primary_communication: 'verbal' | 'pecs' | 'makaton' | 'aac' | 'other' | null;
  primary_communication_other: string | null;
  key_words_phrases: string | null;
  preferred_communication_approach: string | null;
  communication_triggers: string | null;
  calming_techniques: string | null;
  toileting_needs: string | null;
  dressing_support: string | null;
  eating_drinking_support: 'independent' | 'prompted' | 'assisted' | 'peg' | null;
  hygiene_routines: string | null;
  independence_level: 'independent' | 'with_prompts' | 'needs_full_support' | null;
  education_placement: string | null;
  ehcp_targets_linked: boolean;
  daily_learning_goals: string | null;
  independence_skills: string | null;
  social_skills_development: string | null;
  created_at: string;
  updated_at: string;
}

async function fetchClientChildInfo(clientId: string): Promise<ClientChildInfo | null> {
  const { data, error } = await supabase
    .from('client_child_info')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle();

  if (error) throw error;
  return data as ClientChildInfo | null;
}

async function upsertClientChildInfo(childInfo: Partial<ClientChildInfo> & { client_id: string }): Promise<ClientChildInfo> {
  const { data, error } = await supabase
    .from('client_child_info')
    .upsert(childInfo, { 
      onConflict: 'client_id',
      ignoreDuplicates: false 
    })
    .select()
    .single();

  if (error) throw error;
  return data as ClientChildInfo;
}

export function useClientChildInfo(clientId: string) {
  return useQuery({
    queryKey: ['client-child-info', clientId],
    queryFn: () => fetchClientChildInfo(clientId),
    enabled: !!clientId,
  });
}

export function useUpdateClientChildInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertClientChildInfo,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-child-info', data.client_id] });
      queryClient.invalidateQueries({ queryKey: ['client-profile', data.client_id] });
    },
  });
}