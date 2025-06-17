
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
  care_plan_type?: string;
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
  console.log('[fetchCarePlanData] Starting fetch for care plan:', carePlanId);
  
  if (!carePlanId) {
    console.error('[fetchCarePlanData] No care plan ID provided');
    throw new Error('Care plan ID is required');
  }
  
  // Resolve the care plan ID (handles CP-001 -> UUID mapping)
  const resolvedId = resolveCarePlanId(carePlanId);
  console.log('[fetchCarePlanData] Resolved ID:', resolvedId);
  
  try {
    // Fetch care plan data first
    const { data: carePlan, error: carePlanError } = await supabase
      .from('client_care_plans')
      .select('*')
      .eq('id', resolvedId)
      .maybeSingle();

    if (carePlanError) {
      console.error('[fetchCarePlanData] Care plan query error:', carePlanError);
      throw carePlanError;
    }
    
    if (!carePlan) {
      console.log('[fetchCarePlanData] No care plan found for ID:', resolvedId);
      return null;
    }

    console.log('[fetchCarePlanData] Care plan found:', carePlan);

    // Fetch client data separately
    let client = null;
    if (carePlan.client_id) {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', carePlan.client_id)
        .maybeSingle();

      if (clientError) {
        console.error('[fetchCarePlanData] Client query error:', clientError);
        // Don't throw error, just log it and continue without client data
      } else {
        client = clientData;
        console.log('[fetchCarePlanData] Client data found:', client);
      }
    }
    
    // Combine care plan and client data
    const result = {
      ...carePlan,
      client: client
    };
    
    console.log('[fetchCarePlanData] Successfully fetched combined data:', result);
    return result;
  } catch (error) {
    console.error('[fetchCarePlanData] Unexpected error:', error);
    throw error;
  }
};

const fetchClientCarePlansWithDetails = async (clientId: string): Promise<CarePlanWithDetails[]> => {
  console.log('[fetchClientCarePlansWithDetails] Fetching care plans for client:', clientId);
  
  if (!clientId) {
    console.error('[fetchClientCarePlansWithDetails] No client ID provided');
    throw new Error('Client ID is required');
  }
  
  try {
    const { data: carePlans, error } = await supabase
      .from('client_care_plans')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[fetchClientCarePlansWithDetails] Error:', error);
      throw error;
    }

    if (!carePlans || carePlans.length === 0) {
      console.log('[fetchClientCarePlansWithDetails] No care plans found for client:', clientId);
      return [];
    }

    // Fetch client data
    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .maybeSingle();

    // Fetch related data for each care plan
    const carePlansWithDetails = await Promise.all(
      carePlans.map(async (carePlan) => {
        console.log('[fetchClientCarePlansWithDetails] Fetching details for care plan:', carePlan.id);
        
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
          client: client,
          goals: goals || [],
          medications: medications || [],
          activities: activities || []
        } as CarePlanWithDetails;
      })
    );

    console.log('[fetchClientCarePlansWithDetails] Fetched care plans with details:', carePlansWithDetails);
    return carePlansWithDetails;
  } catch (error) {
    console.error('[fetchClientCarePlansWithDetails] Unexpected error:', error);
    throw error;
  }
};

export const useCarePlanData = (carePlanId: string) => {
  return useQuery({
    queryKey: ['care-plan-data', carePlanId],
    queryFn: () => fetchCarePlanData(carePlanId),
    enabled: Boolean(carePlanId),
    retry: (failureCount, error) => {
      console.log('[useCarePlanData] Query failed, attempt:', failureCount + 1, 'Error:', error);
      return failureCount < 2; // Retry up to 2 times
    }
  });
};

export const useClientCarePlansWithDetails = (clientId: string) => {
  return useQuery({
    queryKey: ['client-care-plans-with-details', clientId],
    queryFn: () => fetchClientCarePlansWithDetails(clientId),
    enabled: Boolean(clientId),
    retry: (failureCount, error) => {
      console.log('[useClientCarePlansWithDetails] Query failed, attempt:', failureCount + 1, 'Error:', error);
      return failureCount < 2; // Retry up to 2 times
    }
  });
};
