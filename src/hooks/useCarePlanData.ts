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
  // Client acknowledgment fields
  client_acknowledged_at?: string;
  client_signature_data?: string;
  client_acknowledgment_ip?: string | null;
  acknowledgment_method?: string | null;
  client_comments?: string | null;
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
    end_date?: string;
    status: string;
  }>;
  care_plan_type?: string;
  review_date?: string;
  goals_progress?: number;
  notes?: string;
  isDirectlyAssigned?: boolean; // Flag to indicate if directly assigned to carer
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

  // Transform the data to handle potential null staff relations and type casting
  const transformedData: CarePlanData = {
    ...data,
    staff: data.staff || null,
    client_acknowledgment_ip: data.client_acknowledgment_ip as string | null
  };

  return transformedData;
};

const fetchClientCarePlansWithDetails = async (clientId: string): Promise<CarePlanWithDetails[]> => {
  if (!clientId) {
    console.error('[fetchClientCarePlansWithDetails] No client ID provided');
    return [];
  }

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
    .in('status', ['pending_approval', 'pending_client_approval', 'approved', 'rejected', 'active']) // Include pending_client_approval for client view
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching client care plans with details:', error);
    throw error;
  }

  // Transform the data to handle potential null staff relations and type casting
  const transformedData: CarePlanWithDetails[] = (data || []).map(item => ({
    ...item,
    staff: item.staff || null,
    client_acknowledgment_ip: item.client_acknowledgment_ip as string | null
  }));

  return transformedData;
};

const fetchCarerAssignedCarePlans = async (carerId: string): Promise<CarePlanWithDetails[]> => {
  console.log(`[fetchCarerAssignedCarePlans] Input carer ID: ${carerId}`);

  // First get the carer's branch_id
  const { data: carerData, error: carerError } = await supabase
    .from('staff')
    .select('branch_id')
    .eq('id', carerId)
    .single();

  if (carerError) {
    console.error('Error fetching carer branch:', carerError);
    throw carerError;
  }

  const branchId = carerData?.branch_id;

  // Fetch care plans assigned directly to the carer OR in their branch (fallback)
  const { data, error } = await supabase
    .from('client_care_plans')
    .select(`
      *,
      client:clients(
        id,
        first_name,
        last_name,
        avatar_initials,
        branch_id
      ),
      goals:client_care_plan_goals(*),
      activities:client_activities(*),
      medications:client_medications(*),
      staff:staff!staff_id(
        id,
        first_name,
        last_name
      )
    `)
    .or(`staff_id.eq.${carerId},and(client.branch_id.eq.${branchId},staff_id.is.null)`)
    .in('status', ['active', 'pending_approval', 'approved'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching carer assigned care plans:', error);
    throw error;
  }

  // Transform the data to handle potential null staff relations and type casting
  const transformedData: CarePlanWithDetails[] = (data || []).map(item => ({
    ...item,
    staff: item.staff || null,
    client_acknowledgment_ip: item.client_acknowledgment_ip as string | null,
    // Add a flag to indicate if this is directly assigned or branch-level
    isDirectlyAssigned: item.staff_id === carerId
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

export const useCarerAssignedCarePlans = (carerId: string) => {
  return useQuery({
    queryKey: ['carer-assigned-care-plans', carerId],
    queryFn: () => fetchCarerAssignedCarePlans(carerId),
    enabled: Boolean(carerId),
  });
};
