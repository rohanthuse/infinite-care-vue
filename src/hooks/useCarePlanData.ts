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
  priority?: string;
  review_date?: string;
  goals_progress?: number;
  notes?: string;
  isDirectlyAssigned?: boolean; // Flag to indicate if directly assigned to carer
  // Additional care plan details
  personal_info?: any;
  medical_info?: any;
  personal_care?: any;
  dietary_requirements?: any;
  about_me?: any;
  risk_assessments?: any[];
  service_actions?: any[];
  service_plans?: any[];
  equipment?: any[];
  documents?: any[];
}

const fetchCarePlanData = async (carePlanId: string): Promise<CarePlanWithDetails> => {
  console.log(`[fetchCarePlanData] Input care plan ID: ${carePlanId}`);
  
  // Check if the input is a valid UUID format or a display ID (CP-XXX)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(carePlanId);
  const isDisplayId = /^CP-\d+$/i.test(carePlanId);
  
  let query = supabase
    .from('client_care_plans')
    .select(`
      *,
      client:clients(
        id,
        first_name,
        last_name,
        avatar_initials
      ),
      goals:client_care_plan_goals(*),
      activities:client_activities(*),
      medications:client_medications(*),
      staff:staff!staff_id(
        id,
        first_name,
        last_name
      )
    `);

  // Query by appropriate field based on input format
  if (isUuid) {
    console.log(`[fetchCarePlanData] Querying by UUID: ${carePlanId}`);
    query = query.eq('id', carePlanId);
  } else if (isDisplayId) {
    console.log(`[fetchCarePlanData] Querying by display_id: ${carePlanId}`);
    query = query.eq('display_id', carePlanId);
  } else {
    // Fallback: try resolving via mapping first, then by display_id
    const resolvedId = resolveCarePlanId(carePlanId);
    console.log(`[fetchCarePlanData] Fallback resolved ID: ${resolvedId}`);
    if (resolvedId !== carePlanId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedId)) {
      query = query.eq('id', resolvedId);
    } else {
      query = query.eq('display_id', carePlanId);
    }
  }

  const { data, error } = await query.single();

  if (error) {
    console.error('Error fetching care plan:', error);
    throw error;
  }

  // Extract data from auto_save_data if available
  const autoSaveData = typeof data.auto_save_data === 'object' && data.auto_save_data !== null ? data.auto_save_data as Record<string, any> : {};
  
  // Extract goals from auto_save_data if not available from joined table
  const goalsFromAutoSave = Array.isArray(autoSaveData.goals) ? autoSaveData.goals.map((goal: any, index: number) => ({
    id: `goal-${index}`,
    description: goal.description || goal.goal_description || '',
    status: goal.status || 'active',
    progress: goal.progress || 0,
    notes: goal.notes || goal.additional_notes || ''
  })) : [];

  // Extract medications from auto_save_data if not available from joined table
  const medicationsFromAutoSave = Array.isArray(autoSaveData.medications) ? autoSaveData.medications.map((med: any, index: number) => ({
    id: `med-${index}`,
    name: med.medication_name || med.name || '',
    dosage: med.dosage || '',
    frequency: med.frequency || '',
    start_date: med.start_date || '',
    end_date: med.end_date || '',
    status: med.status || 'active'
  })) : [];

  // Extract activities from auto_save_data if not available from joined table
  const activitiesFromAutoSave = Array.isArray(autoSaveData.activities) ? autoSaveData.activities.map((activity: any, index: number) => ({
    id: `activity-${index}`,
    name: activity.activity_name || activity.name || '',
    description: activity.description || '',
    frequency: activity.frequency || '',
    status: activity.status || 'active'
  })) : [];

  // Transform the data to handle potential null staff relations and extract data from auto_save_data
  const transformedData: CarePlanWithDetails = {
    ...data,
    staff: data.staff || null,
    client_acknowledgment_ip: data.client_acknowledgment_ip as string | null,
    // Use auto_save_data if joined tables are empty
    goals: data.goals?.length > 0 ? data.goals : goalsFromAutoSave,
    medications: data.medications?.length > 0 ? data.medications : medicationsFromAutoSave,
    activities: data.activities?.length > 0 ? data.activities : activitiesFromAutoSave,
    // Add additional extracted data from auto_save_data
    care_plan_type: autoSaveData.care_plan_type || data.care_plan_type,
    priority: autoSaveData.priority || data.priority,
    review_date: autoSaveData.review_date || data.review_date,
    goals_progress: autoSaveData.goals_progress || data.goals_progress,
    notes: autoSaveData.notes || data.notes,
    // Extract additional care plan details
    personal_info: autoSaveData.personal_info || {},
    medical_info: autoSaveData.medical_info || {},
    personal_care: autoSaveData.personal_care || {},
    dietary_requirements: autoSaveData.dietary_requirements || autoSaveData.dietary || {},
    about_me: autoSaveData.about_me || {},
    // Also extract other detailed sections as in fetchClientCarePlansWithDetails
    risk_assessments: Array.isArray(autoSaveData.risk_assessments) ? autoSaveData.risk_assessments : [],
    service_actions: Array.isArray(autoSaveData.service_actions) ? autoSaveData.service_actions : [],
    service_plans: Array.isArray(autoSaveData.service_plans) ? autoSaveData.service_plans : [],
    equipment: Array.isArray(autoSaveData.equipment) ? autoSaveData.equipment : [],
    documents: Array.isArray(autoSaveData.documents) ? autoSaveData.documents : []
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

  // Transform the data to handle potential null staff relations and extract data from auto_save_data
  const transformedData: CarePlanWithDetails[] = (data || []).map(item => {
    const autoSaveData = typeof item.auto_save_data === 'object' && item.auto_save_data !== null ? item.auto_save_data as Record<string, any> : {};
    
    // Extract goals from auto_save_data if not available from joined table
    const goalsFromAutoSave = Array.isArray(autoSaveData.goals) ? autoSaveData.goals.map((goal: any, index: number) => ({
      id: `goal-${index}`,
      description: goal.description || goal.goal_description || '',
      status: goal.status || 'active',
      progress: goal.progress || 0,
      notes: goal.notes || goal.additional_notes || ''
    })) : [];

    // Extract medications from auto_save_data if not available from joined table
    const medicationsFromAutoSave = Array.isArray(autoSaveData.medications) ? autoSaveData.medications.map((med: any, index: number) => ({
      id: `med-${index}`,
      name: med.medication_name || med.name || '',
      dosage: med.dosage || '',
      frequency: med.frequency || '',
      start_date: med.start_date || '',
      end_date: med.end_date || '',
      status: med.status || 'active'
    })) : [];

    // Extract activities from auto_save_data if not available from joined table
    const activitiesFromAutoSave = Array.isArray(autoSaveData.activities) ? autoSaveData.activities.map((activity: any, index: number) => ({
      id: `activity-${index}`,
      name: activity.activity_name || activity.name || '',
      description: activity.description || '',
      frequency: activity.frequency || '',
      status: activity.status || 'active'
    })) : [];

    // Extract service plans from auto_save_data
    const servicePlansFromAutoSave = Array.isArray(autoSaveData.service_plans) ? autoSaveData.service_plans.map((plan: any, index: number) => ({
      id: `service-plan-${index}`,
      service_name: plan.service_name || '',
      service_category: plan.service_category || '',
      provider_name: plan.provider_name || '',
      frequency: plan.frequency || '',
      start_date: plan.start_date || '',
      end_date: plan.end_date || '',
      duration: plan.duration || '',
      goals: Array.isArray(plan.goals) ? plan.goals : [],
      notes: plan.notes || ''
    })) : [];

    // Extract service actions from auto_save_data
    const serviceActionsFromAutoSave = Array.isArray(autoSaveData.service_actions) ? autoSaveData.service_actions.map((action: any, index: number) => ({
      id: `service-action-${index}`,
      service_name: action.service_name || '',
      service_category: action.service_category || '',
      provider_name: action.provider_name || '',
      start_date: action.start_date || '',
      end_date: action.end_date || '',
      objectives: action.objectives || '',
      frequency: action.frequency || '',
      duration: action.duration || '',
      schedule_notes: action.schedule_notes || '',
      status: action.status || 'active'
    })) : [];

    // Extract equipment from auto_save_data
    const equipmentFromAutoSave = Array.isArray(autoSaveData.equipment) ? autoSaveData.equipment.map((item: any, index: number) => ({
      id: `equipment-${index}`,
      equipment_name: item.equipment_name || '',
      equipment_type: item.equipment_type || '',
      manufacturer: item.manufacturer || '',
      model: item.model || '',
      serial_number: item.serial_number || '',
      location: item.location || '',
      installation_date: item.installation_date || '',
      maintenance_schedule: item.maintenance_schedule || '',
      next_maintenance: item.next_maintenance || '',
      status: item.status || 'active'
    })) : [];

    // Extract risk assessments from auto_save_data
    const riskAssessmentsFromAutoSave = Array.isArray(autoSaveData.risk_assessments) ? autoSaveData.risk_assessments.map((risk: any, index: number) => ({
      id: `risk-${index}`,
      risk_type: risk.risk_type || '',
      risk_level: risk.risk_level || '',
      risk_factors: Array.isArray(risk.risk_factors) ? risk.risk_factors : [],
      mitigation_strategies: Array.isArray(risk.mitigation_strategies) ? risk.mitigation_strategies : [],
      assessment_date: risk.assessment_date || '',
      next_review_date: risk.next_review_date || '',
      assessed_by: risk.assessed_by || '',
      status: risk.status || 'active'
    })) : [];

    // Extract documents from auto_save_data
    const documentsFromAutoSave = Array.isArray(autoSaveData.documents) ? autoSaveData.documents.map((doc: any, index: number) => ({
      id: `document-${index}`,
      document_type: doc.document_type || '',
      document_name: doc.document_name || '',
      consent_given: doc.consent_given || false,
      consent_date: doc.consent_date || '',
      witness_name: doc.witness_name || '',
      notes: doc.notes || ''
    })) : [];

    return {
      ...item,
      staff: item.staff || null,
      client_acknowledgment_ip: item.client_acknowledgment_ip as string | null,
      // Use auto_save_data if joined tables are empty
      goals: item.goals?.length > 0 ? item.goals : goalsFromAutoSave,
      medications: item.medications?.length > 0 ? item.medications : medicationsFromAutoSave,
      activities: item.activities?.length > 0 ? item.activities : activitiesFromAutoSave,
      // Add additional extracted data from auto_save_data
      care_plan_type: autoSaveData.care_plan_type || item.care_plan_type,
      priority: autoSaveData.priority || item.priority,
      review_date: autoSaveData.review_date || item.review_date,
      goals_progress: autoSaveData.goals_progress || item.goals_progress,
      notes: autoSaveData.notes || item.notes,
      // Extract additional care plan details
      personal_info: autoSaveData.personal_info || {},
      medical_info: autoSaveData.medical_info || {},
      personal_care: autoSaveData.personal_care || {},
      dietary_requirements: autoSaveData.dietary_requirements || autoSaveData.dietary || {},
      about_me: autoSaveData.about_me || {},
      risk_assessments: riskAssessmentsFromAutoSave,
      service_actions: serviceActionsFromAutoSave,
      service_plans: servicePlansFromAutoSave,
      equipment: equipmentFromAutoSave,
      documents: documentsFromAutoSave
    };
  });

  return transformedData;
};

const fetchCarerAssignedCarePlans = async (carerId: string): Promise<CarePlanWithDetails[]> => {
  console.log(`[fetchCarerAssignedCarePlans] Input carer ID (auth user ID): ${carerId}`);

  // First get the carer's staff record and branch_id
  const { data: carerData, error: carerError } = await supabase
    .from('staff')
    .select('id, branch_id')
    .eq('auth_user_id', carerId)
    .single();

  if (carerError) {
    console.error('Error fetching carer staff record:', carerError);
    throw carerError;
  }

  const staffId = carerData?.id;
  const branchId = carerData?.branch_id;

  console.log(`[fetchCarerAssignedCarePlans] Staff ID: ${staffId}, Branch ID: ${branchId}`);

  // Fetch care plans assigned directly to the carer OR in their branch (fallback)
  // First get directly assigned care plans (using staff.id, not auth_user_id)
  const directQuery = supabase
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
    .eq('staff_id', staffId)  // Use staff.id, not auth_user_id
    .in('status', ['active', 'pending_approval', 'approved']);

  // Then get branch-level care plans where staff_id is null
  const branchQuery = supabase
    .from('client_care_plans')
    .select(`
      *,
      client:clients!inner(
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
    .eq('client.branch_id', branchId)
    .is('staff_id', null)
    .in('status', ['active', 'pending_approval', 'approved']);

  const [directResult, branchResult] = await Promise.all([directQuery, branchQuery]);

  if (directResult.error && branchResult.error) {
    console.error('Error fetching carer assigned care plans:', directResult.error || branchResult.error);
    throw directResult.error || branchResult.error;
  }

  // Combine the results
  const combinedData = [
    ...(directResult.data || []),
    ...(branchResult.data || [])
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Transform the data similar to fetchClientCarePlansWithDetails
  const transformedData: CarePlanWithDetails[] = combinedData.map(item => {
    const autoSaveData = typeof item.auto_save_data === 'object' && item.auto_save_data !== null ? item.auto_save_data as Record<string, any> : {};
    
    // Extract goals from auto_save_data if not available from joined table
    const goalsFromAutoSave = Array.isArray(autoSaveData.goals) ? autoSaveData.goals.map((goal: any, index: number) => ({
      id: `goal-${index}`,
      description: goal.description || goal.goal_description || '',
      status: goal.status || 'active',
      progress: goal.progress || 0,
      notes: goal.notes || goal.additional_notes || ''
    })) : [];

    // Extract medications from auto_save_data if not available from joined table
    const medicationsFromAutoSave = Array.isArray(autoSaveData.medications) ? autoSaveData.medications.map((med: any, index: number) => ({
      id: `med-${index}`,
      name: med.medication_name || med.name || '',
      dosage: med.dosage || '',
      frequency: med.frequency || '',
      start_date: med.start_date || '',
      end_date: med.end_date || '',
      status: med.status || 'active'
    })) : [];

    // Extract activities from auto_save_data if not available from joined table
    const activitiesFromAutoSave = Array.isArray(autoSaveData.activities) ? autoSaveData.activities.map((activity: any, index: number) => ({
      id: `activity-${index}`,
      name: activity.activity_name || activity.name || '',
      description: activity.description || '',
      frequency: activity.frequency || '',
      status: activity.status || 'active'
    })) : [];

    return {
      ...item,
      staff: item.staff || null,
      client_acknowledgment_ip: item.client_acknowledgment_ip as string | null,
      // Use auto_save_data if joined tables are empty
      goals: item.goals?.length > 0 ? item.goals : goalsFromAutoSave,
      medications: item.medications?.length > 0 ? item.medications : medicationsFromAutoSave,
      activities: item.activities?.length > 0 ? item.activities : activitiesFromAutoSave,
      // Add additional extracted data from auto_save_data
      care_plan_type: autoSaveData.care_plan_type || item.care_plan_type,
      priority: autoSaveData.priority || item.priority,
      review_date: autoSaveData.review_date || item.review_date,
      goals_progress: autoSaveData.goals_progress || item.goals_progress,
      notes: autoSaveData.notes || item.notes,
      // Extract additional care plan details
      personal_info: autoSaveData.personal_info || {},
      medical_info: autoSaveData.medical_info || {},
      personal_care: autoSaveData.personal_care || {},
      dietary_requirements: autoSaveData.dietary_requirements || autoSaveData.dietary || {},
      about_me: autoSaveData.about_me || {},
      risk_assessments: Array.isArray(autoSaveData.risk_assessments) ? autoSaveData.risk_assessments : [],
      service_actions: Array.isArray(autoSaveData.service_actions) ? autoSaveData.service_actions : [],
      service_plans: Array.isArray(autoSaveData.service_plans) ? autoSaveData.service_plans : [],
      equipment: Array.isArray(autoSaveData.equipment) ? autoSaveData.equipment : [],
      documents: Array.isArray(autoSaveData.documents) ? autoSaveData.documents : [],
      // Add a flag to indicate if this is directly assigned or branch-level
      isDirectlyAssigned: item.staff_id === staffId
    };
  });

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
