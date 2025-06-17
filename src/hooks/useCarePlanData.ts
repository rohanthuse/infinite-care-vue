
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { resolveCarePlanId } from '@/utils/carePlanIdMapping';

export interface CarePlanData {
  id: string;
  client_id: string;
  title: string;
  provider_name: string;
  start_date: string;
  end_date?: string;
  review_date?: string;
  status: string;
  goals_progress?: number;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    date_of_birth?: string;
    address?: string;
    gender?: string;
    preferred_name?: string;
    status?: string;
    branch_id?: string;
    title?: string;
    middle_name?: string;
    telephone_number?: string;
    mobile_number?: string;
    country_code?: string;
    region?: string;
    referral_route?: string;
    pronouns?: string;
    other_identifier?: string;
    additional_information?: string;
    avatar_initials?: string;
    registered_on?: string;
  };
}

const fetchCarePlanData = async (carePlanId: string): Promise<CarePlanData | null> => {
  console.log('[fetchCarePlanData] Fetching care plan:', carePlanId);
  
  // Resolve the care plan ID (handles CP-001 -> UUID mapping)
  const resolvedId = resolveCarePlanId(carePlanId);
  
  const { data, error } = await supabase
    .from('client_care_plans')
    .select(`
      *,
      client:clients(*)
    `)
    .eq('id', resolvedId)
    .single();

  if (error) {
    console.error('[fetchCarePlanData] Error:', error);
    return null;
  }
  
  console.log('[fetchCarePlanData] Fetched data:', data);
  return data;
};

export const useCarePlanData = (carePlanId: string) => {
  return useQuery({
    queryKey: ['care-plan-data', carePlanId],
    queryFn: () => fetchCarePlanData(carePlanId),
    enabled: Boolean(carePlanId),
  });
};
