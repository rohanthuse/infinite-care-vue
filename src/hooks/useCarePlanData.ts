
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

export interface CarePlanWithDetails extends CarePlanData {
  goals?: Array<{
    id: string;
    description: string;
    status: string;
    progress?: number;
    notes?: string;
  }>;
  medications?: Array<{
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    status: string;
    start_date: string;
    end_date?: string;
  }>;
  activities?: Array<{
    id: string;
    name: string;
    description?: string;
    frequency: string;
    status: string;
  }>;
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

const fetchClientCarePlansWithDetails = async (clientId: string): Promise<CarePlanWithDetails[]> => {
  console.log('[fetchClientCarePlansWithDetails] Fetching care plans for client:', clientId);
  
  const { data: carePlans, error } = await supabase
    .from('client_care_plans')
    .select(`
      *,
      client:clients(*)
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[fetchClientCarePlansWithDetails] Error:', error);
    throw error;
  }

  if (!carePlans || carePlans.length === 0) {
    return [];
  }

  // Fetch related data for each care plan
  const carePlansWithDetails = await Promise.all(
    carePlans.map(async (carePlan) => {
      // Fetch goals
      const { data: goals } = await supabase
        .from('client_care_plan_goals')
        .select('*')
        .eq('care_plan_id', carePlan.id);

      // Fetch medications
      const { data: medications } = await supabase
        .from('client_medications')
        .select('*')
        .eq('care_plan_id', carePlan.id);

      // Fetch activities
      const { data: activities } = await supabase
        .from('client_activities')
        .select('*')
        .eq('care_plan_id', carePlan.id);

      return {
        ...carePlan,
        goals: goals || [],
        medications: medications || [],
        activities: activities || []
      } as CarePlanWithDetails;
    })
  );

  console.log('[fetchClientCarePlansWithDetails] Fetched care plans with details:', carePlansWithDetails);
  return carePlansWithDetails;
};

export const useCarePlanData = (carePlanId: string) => {
  return useQuery({
    queryKey: ['care-plan-data', carePlanId],
    queryFn: () => fetchCarePlanData(carePlanId),
    enabled: Boolean(carePlanId),
  });
};

export const useClientCarePlansWithDetails = (clientId: string) => {
  return useQuery({
    queryKey: ['client-care-plans-with-details', clientId],
    queryFn: () => fetchClientCarePlansWithDetails(clientId),
    enabled: Boolean(clientId),
  });
};
