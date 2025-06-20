
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { resolveCarePlanId } from '@/utils/carePlanIdMapping';

export interface CarePlanData {
  id: string;
  display_id: string;
  client_id: string;
  title: string;
  provider_name: string;
  staff_id?: string;
  start_date: string;
  end_date?: string;
  status: string;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_initials?: string;
  };
  staff?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

export interface CarePlanWithDetails extends CarePlanData {
  goals?: Array<{
    id: string;
    description: string;
    status: string;
    progress?: number;
    notes?: string;
  }>;
  activities?: Array<{
    id: string;
    name: string;
    description?: string;
    frequency: string;
    status: string;
  }>;
  medications?: Array<{
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    start_date: string;
    status: string;
  }>;
  care_plan_type?: string;
  review_date?: string;
  goals_progress?: number;
}

const fetchCarePlanData = async (carePlanId: string): Promise<CarePlanData> => {
  console.log(`[fetchCarePlanData] Input care plan ID: ${carePlanId}`);
  
  // Resolve the care plan ID to get the actual UUID
  const resolvedId = resolveCarePlanId(carePlanId);
  console.log(`[fetchCarePlanData] Resolved care plan ID: ${resolvedId}`);

  const { data, error } = await supabase
    .from('client_care_plans')
    .select(`
      *,
      client:clients(
        id,
        first_name,
        last_name,
        avatar_initials
      ),
      staff:staff!staff_id(
        id,
        first_name,
        last_name
      )
    `)
    .eq('id', resolvedId)
    .single();

  if (error) {
    console.error('Error fetching care plan:', error);
    throw error;
  }

  // Handle the case where staff might be null or undefined
  const transformedData: CarePlanData = {
    ...data,
    staff: data.staff || null
  };

  return transformedData;
};

const fetchClientCarePlansWithDetails = async (clientId: string): Promise<CarePlanWithDetails[]> => {
  console.log(`[fetchClientCarePlansWithDetails] Input client ID: ${clientId}`);

  const { data, error } = await supabase
    .from('client_care_plans')
    .select(`
      *,
      goals:client_care_plan_goals(*),
      activities:client_activities(*),
      medications:client_medications(*),
      staff:staff!staff_id(
        id,
        first_name,
        last_name
      )
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching client care plans with details:', error);
    throw error;
  }

  // Transform the data to handle potential null staff relations
  const transformedData: CarePlanWithDetails[] = (data || []).map(item => ({
    ...item,
    staff: item.staff || null
  }));

  return transformedData;
};

export const useCarePlanData = (carePlanId: string) => {
  return useQuery({
    queryKey: ['care-plan', carePlanId],
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
