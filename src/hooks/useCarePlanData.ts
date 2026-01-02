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
    age_group?: string;
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
    priority?: string;
    target_date?: string;
    measurable_outcome?: string;
  }>;
  activities?: Array<{
    id: string;
    name: string;
    description?: string;
    frequency: string;
    status: string;
    duration?: string;
    time_of_day?: string[];
  }>;
  medications?: Array<{
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    start_date: string;
    end_date?: string;
    status: string;
    instructions?: string;
    time_of_day?: string[];
  }>;
  care_plan_type?: string;
  priority?: string;
  review_date?: string;
  goals_progress?: number;
  notes?: string;
  isDirectlyAssigned?: boolean; // Flag to indicate if directly assigned to carer
  // Additional care plan details
  auto_save_data?: Record<string, any> | null; // Preserve raw auto_save_data for View/Edit
  personal_info?: any;
  medical_info?: any;
  personal_care?: any;
  dietary_requirements?: any;
  about_me?: any;
  consent?: any;
  general?: any;
  hobbies?: any;
  key_contacts?: any[]; // Key contacts from DB and JSON merged
  risk_assessments?: any[];
  service_actions?: any[];
  service_plans?: any[];
  equipment?: any;
  documents?: any[];
}

// Helper function to merge JSON data with unique DB records (JSON-First strategy)
const mergeWithDatabase = <T extends Record<string, any>>(
  jsonItems: T[],
  dbItems: T[],
  matchKey: 'name' | 'description' | 'id' = 'name'
): T[] => {
  const allItems = [...jsonItems];
  const existingKeys = new Set(
    jsonItems.map(item => {
      if (matchKey === 'description') return item.description?.toLowerCase()?.trim();
      if (matchKey === 'name') return (item.name || item.action_name)?.toLowerCase()?.trim();
      return item.id;
    }).filter(Boolean)
  );
  
  // Add unique DB records that don't exist in JSON
  dbItems.forEach(dbItem => {
    const itemKey = matchKey === 'description' 
      ? dbItem.description?.toLowerCase()?.trim()
      : matchKey === 'name' 
        ? (dbItem.name || dbItem.action_name)?.toLowerCase()?.trim()
        : dbItem.id;
    
    if (itemKey && !existingKeys.has(itemKey)) {
      allItems.push(dbItem);
    }
  });
  
  return allItems;
};

// Helper function to normalize equipment structure (handle both old array and new object formats)
const normalizeEquipmentStructure = (equipment: any): any => {
  if (Array.isArray(equipment)) {
    // Old format - array of equipment items
    return {
      equipment_blocks: equipment.map((item: any, index: number) => ({
        id: item.id || `equipment-${index}`,
        equipment_name: item.equipment_name || item.name || '',
        equipment_type: item.equipment_type || item.type || '',
        quantity: item.quantity || 1,
        location: item.location || '',
        maintenance_required: item.maintenance_required || false,
        maintenance_schedule: item.maintenance_schedule || '',
        maintenance_notes: item.maintenance_notes || '',
        supplier: item.supplier || '',
        notes: item.notes || item.additional_notes || '',
      })),
      moving_handling: {},
      environment_checks: {},
      home_repairs: {}
    };
  } else if (equipment && typeof equipment === 'object') {
    // New format - object with nested structures
    return {
      equipment_blocks: Array.isArray(equipment.equipment_blocks) ? equipment.equipment_blocks : [],
      moving_handling: equipment.moving_handling || {},
      environment_checks: equipment.environment_checks || {},
      home_repairs: equipment.home_repairs || {}
    };
  }
  
  return { equipment_blocks: [], moving_handling: {}, environment_checks: {}, home_repairs: {} };
};

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
        avatar_initials,
        date_of_birth,
        phone,
        address,
        email,
        additional_information,
        age_group,
        client_personal_info(
          emergency_contact_name,
          emergency_contact_phone,
          emergency_contact_relationship,
          preferred_communication,
          cultural_preferences,
          language_preferences,
          religion,
          marital_status,
          next_of_kin_name,
          next_of_kin_phone,
          next_of_kin_relationship,
          gp_name,
          gp_practice,
          gp_phone
        )
      ),
      goals:client_care_plan_goals(*),
      activities:client_activities(*),
      medications:client_medications(*),
      staff:staff!staff_id(
        id,
        first_name,
        last_name
      ),
      staff_assignments:care_plan_staff_assignments(
        id,
        staff_id,
        is_primary,
        staff:staff(id, first_name, last_name, specialization)
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

  // Fetch key contacts from database
  const { data: dbKeyContacts } = await supabase
    .from('client_key_contacts')
    .select('*')
    .eq('client_id', data.client_id);

  // Helper function to normalize personal info from multiple sources
  const normalizePersonalInfo = (autoSaveData: Record<string, any>, clientData: any) => {
    const personalInfoFromAutoSave = autoSaveData.personal_info || {};
    const clientPersonalInfo = clientData?.client_personal_info?.[0] || {};
    
    return {
      date_of_birth: personalInfoFromAutoSave.date_of_birth || clientData?.date_of_birth,
      phone: personalInfoFromAutoSave.phone || clientData?.phone,
      address: personalInfoFromAutoSave.address || clientData?.address,
      email: personalInfoFromAutoSave.email || clientData?.email,
      emergency_contact_name: personalInfoFromAutoSave.emergency_contact_name || clientPersonalInfo.emergency_contact_name,
      emergency_contact_phone: personalInfoFromAutoSave.emergency_contact_phone || clientPersonalInfo.emergency_contact_phone,
      emergency_contact_relationship: personalInfoFromAutoSave.emergency_contact_relationship || clientPersonalInfo.emergency_contact_relationship,
      preferred_communication: personalInfoFromAutoSave.preferred_communication || clientPersonalInfo.preferred_communication,
      cultural_preferences: personalInfoFromAutoSave.cultural_preferences || clientPersonalInfo.cultural_preferences,
      language_preferences: personalInfoFromAutoSave.language_preferences || clientPersonalInfo.language_preferences,
      religion: personalInfoFromAutoSave.religion || clientPersonalInfo.religion,
      marital_status: personalInfoFromAutoSave.marital_status || clientPersonalInfo.marital_status,
      next_of_kin_name: personalInfoFromAutoSave.next_of_kin_name || clientPersonalInfo.next_of_kin_name,
      next_of_kin_phone: personalInfoFromAutoSave.next_of_kin_phone || clientPersonalInfo.next_of_kin_phone,
      next_of_kin_relationship: personalInfoFromAutoSave.next_of_kin_relationship || clientPersonalInfo.next_of_kin_relationship,
      gp_name: personalInfoFromAutoSave.gp_name || clientPersonalInfo.gp_name,
      gp_practice: personalInfoFromAutoSave.gp_practice || clientPersonalInfo.gp_practice,
      gp_phone: personalInfoFromAutoSave.gp_phone || clientPersonalInfo.gp_phone,
      ...personalInfoFromAutoSave // Include any other fields from auto_save_data
    };
  };

  // Extract data from auto_save_data if available - Enhanced extraction
  const autoSaveData = typeof data.auto_save_data === 'object' && data.auto_save_data !== null ? data.auto_save_data as Record<string, any> : {};
  
  // Extract goals from auto_save_data (JSON-First)
  const goalsFromAutoSave = Array.isArray(autoSaveData.goals) ? autoSaveData.goals.map((goal: any, index: number) => ({
    id: `json-goal-${index}`,
    description: goal.description || goal.goal_description || '',
    status: goal.status || 'active',
    progress: goal.progress || 0,
    notes: goal.notes || goal.additional_notes || '',
    priority: goal.priority || 'medium',
    target_date: goal.target_date || null,
    measurable_outcome: goal.measurable_outcome || null,
  })) : [];

  // Extract medications from auto_save_data - check all possible locations (JSON-First)
  const medicationsSource = autoSaveData.medications || 
    autoSaveData.medical_info?.medication_manager?.medications ||
    autoSaveData.medical_info?.medications || 
    [];
  const medicationsFromAutoSave = Array.isArray(medicationsSource) ? medicationsSource.map((med: any, index: number) => ({
    id: med.id || `json-med-${index}`,
    name: med.medication_name || med.name || '',
    dosage: med.dosage || '',
    frequency: med.frequency || '',
    start_date: med.start_date || '',
    end_date: med.end_date || '',
    status: med.status || 'active',
    instructions: med.instructions || med.instruction || '',
    time_of_day: med.time_of_day || [],
  })) : [];

  // Enhanced medication manager extraction
  const medicationManagerFromAutoSave = autoSaveData.medical_info?.medication_manager || {};

  // Extract activities from auto_save_data (JSON-First)
  const activitiesFromAutoSave = Array.isArray(autoSaveData.activities) ? autoSaveData.activities.map((activity: any, index: number) => ({
    id: `json-activity-${index}`,
    name: activity.activity_name || activity.name || '',
    description: activity.description || '',
    frequency: activity.frequency || '',
    status: activity.status || 'active',
    duration: activity.duration || '',
    time_of_day: Array.isArray(activity.time_of_day) ? activity.time_of_day : (activity.time_of_day ? [activity.time_of_day] : []),
  })) : [];

  // Extract key contacts from auto_save_data
  const keyContactsFromAutoSave = Array.isArray(autoSaveData.key_contacts) ? autoSaveData.key_contacts : [];
  
  // Merge key contacts: JSON first, then add unique DB records
  const mergedKeyContacts = mergeWithDatabase(
    keyContactsFromAutoSave,
    (dbKeyContacts || []).map(contact => ({
      ...contact,
      name: `${contact.first_name || ''} ${contact.surname || ''}`.trim(),
    })),
    'name'
  );

  // Enhanced extraction of complex nested structures
  const extractComplexData = (key: string, defaultValue: any = []) => {
    if (Array.isArray(autoSaveData[key]) && autoSaveData[key].length > 0) {
      return autoSaveData[key];
    }
    return defaultValue;
  };

  // Merge goals: JSON-First with unique DB records
  const dbGoalsTransformed = (data.goals || []).map((goal: any) => ({
    id: goal.id,
    description: goal.description || '',
    status: goal.status || 'active',
    progress: goal.progress || 0,
    notes: goal.notes || '',
  }));
  const mergedGoals = mergeWithDatabase(goalsFromAutoSave, dbGoalsTransformed, 'description');

  // Merge activities: JSON-First with unique DB records
  const dbActivitiesTransformed = (data.activities || []).map((activity: any) => ({
    id: activity.id,
    name: activity.name || '',
    description: activity.description || '',
    frequency: activity.frequency || '',
    status: activity.status || 'active',
  }));
  const mergedActivities = mergeWithDatabase(activitiesFromAutoSave, dbActivitiesTransformed, 'name');

  // Merge medications: JSON-First with unique DB records  
  const dbMedicationsTransformed = (data.medications || []).map((med: any) => ({
    id: med.id,
    name: med.name || '',
    dosage: med.dosage || '',
    frequency: med.frequency || '',
    start_date: med.start_date || '',
    end_date: med.end_date || '',
    status: med.status || 'active',
  }));
  const mergedMedications = mergeWithDatabase(medicationsFromAutoSave, dbMedicationsTransformed, 'name');

  // Log data source analysis for debugging
  console.log('[fetchCarePlanData] Data source analysis:', {
    carePlanId,
    dbGoalsCount: data.goals?.length || 0,
    jsonGoalsCount: goalsFromAutoSave.length,
    mergedGoalsCount: mergedGoals.length,
    dbActivitiesCount: data.activities?.length || 0,
    jsonActivitiesCount: activitiesFromAutoSave.length,
    mergedActivitiesCount: mergedActivities.length,
    dbMedicationsCount: data.medications?.length || 0,
    jsonMedicationsCount: medicationsFromAutoSave.length,
    mergedMedicationsCount: mergedMedications.length,
    dbKeyContactsCount: dbKeyContacts?.length || 0,
    jsonKeyContactsCount: keyContactsFromAutoSave.length,
    mergedKeyContactsCount: mergedKeyContacts.length,
    riskAssessmentsCount: extractComplexData('risk_assessments', []).length,
    serviceActionsCount: extractComplexData('service_actions', []).length,
    servicePlansCount: extractComplexData('service_plans', []).length,
  });

  // Transform the data to handle potential null staff relations and extract data from auto_save_data - Enhanced
  const transformedData: CarePlanWithDetails = {
    ...data,
    auto_save_data: autoSaveData, // Preserve raw auto_save_data for View/Edit
    staff: data.staff || null,
    client_acknowledgment_ip: data.client_acknowledgment_ip as string | null,
    // Use JSON-First Merged strategy for goals, activities, medications
    goals: mergedGoals,
    medications: mergedMedications,
    activities: mergedActivities,
    // Add merged key contacts
    key_contacts: mergedKeyContacts,
    // Enhanced basic field extraction from auto_save_data
    care_plan_type: autoSaveData.care_plan_type || data.care_plan_type,
    priority: autoSaveData.priority || data.priority,
    review_date: autoSaveData.review_date || data.review_date,
    end_date: autoSaveData.end_date || data.end_date,
    goals_progress: autoSaveData.goals_progress || data.goals_progress,
    notes: autoSaveData.notes || autoSaveData.additional_notes || data.notes,
    // Extract additional care plan details with normalized personal info
    personal_info: normalizePersonalInfo(autoSaveData, data.client),
    // Enhanced medical info extraction
    medical_info: {
      ...autoSaveData.medical_info || {},
      medication_manager: {
        ...medicationManagerFromAutoSave,
        medications: mergedMedications,
      },
      admin_medication: autoSaveData.medical_info?.admin_medication || {},
    },
    // Enhanced personal care extraction with detailed fields
    personal_care: {
      ...autoSaveData.personal_care || {},
      // Ensure all sleep-related fields are extracted
      sleep_go_to_bed_time: autoSaveData.personal_care?.sleep_go_to_bed_time,
      sleep_wake_up_time: autoSaveData.personal_care?.sleep_wake_up_time,
      sleep_get_out_of_bed_time: autoSaveData.personal_care?.sleep_get_out_of_bed_time,
      sleep_prepare_duration: autoSaveData.personal_care?.sleep_prepare_duration,
      assist_going_to_bed: autoSaveData.personal_care?.assist_going_to_bed,
      assist_getting_out_of_bed: autoSaveData.personal_care?.assist_getting_out_of_bed,
      incontinence_products_required: autoSaveData.personal_care?.incontinence_products_required,
    },
    dietary_requirements: autoSaveData.dietary_requirements || autoSaveData.dietary || {},
    // Pass through about_me as-is to preserve all actual field names from database
    about_me: autoSaveData.about_me || {},
    consent: autoSaveData.consent || {},
    hobbies: autoSaveData.hobbies || {},
    // Enhanced extraction of complex structures with proper date handling and field normalization
    risk_assessments: extractComplexData('risk_assessments', []).map((assessment: any) => ({
      ...assessment,
      risk_type: assessment.risk_type || assessment.type || assessment.category,
      risk_level: assessment.risk_level || assessment.level,
      description: assessment.description || assessment.risk_description,
      mitigation_strategies: assessment.mitigation_strategies || assessment.strategies || assessment.control_measures || [],
      review_date: assessment.review_date ? new Date(assessment.review_date).toISOString().split('T')[0] : null,
      assessed_by: assessment.assessed_by || assessment.reviewed_by,
      notes: assessment.notes || assessment.additional_notes || '',
      assessment_date: assessment.assessment_date ? new Date(assessment.assessment_date).toISOString().split('T')[0] : null,
    })),
    service_actions: extractComplexData('service_actions', []).map((action: any) => ({
      ...action,
      id: action.id || crypto.randomUUID(),
      action_type: action.action_type || 'new',
      action_name: action.action_name || action.action || action.name || action.action_description || '',
      has_instructions: action.has_instructions || false,
      instructions: action.instructions || action.schedule_details || '',
      required_written_outcome: action.required_written_outcome || false,
      written_outcome: action.written_outcome || '',
      is_service_specific: action.is_service_specific || false,
      linked_service_id: action.linked_service_id || '',
      linked_service_name: action.linked_service_name || '',
      start_date: action.start_date ? new Date(action.start_date).toISOString().split('T')[0] : null,
      end_date: action.end_date ? new Date(action.end_date).toISOString().split('T')[0] : null,
      schedule_type: action.schedule_type || 'shift',
      shift_times: action.shift_times || [],
      start_time: action.start_time || '',
      end_time: action.end_time || '',
      selected_days: action.selected_days || [],
      frequency: action.frequency || '',
      notes: action.notes || action.additional_notes || '',
      status: action.status || 'active',
      registered_on: action.registered_on,
      registered_by: action.registered_by,
      registered_by_name: action.registered_by_name || '',
      is_saved: true,
    })),
    service_plans: extractComplexData('service_plans', []).map((plan: any) => ({
      ...plan,
      id: plan.id || crypto.randomUUID(),
      caption: plan.caption || '',
      service_id: plan.service_id || '',
      service_name: plan.service_name || plan.name || '',
      authority: plan.authority || '',
      authority_category: plan.authority_category || '',
      start_date: plan.start_date ? new Date(plan.start_date).toISOString().split('T')[0] : null,  
      end_date: plan.end_date ? new Date(plan.end_date).toISOString().split('T')[0] : null,
      start_time: plan.start_time || '',
      end_time: plan.end_time || '',
      selected_days: plan.selected_days || [],
      frequency: plan.frequency || '',
      location: plan.location || '',
      note: plan.note || plan.notes || plan.additional_notes || '',
      status: plan.status || 'active',
      registered_on: plan.registered_on,
      registered_by: plan.registered_by,
      registered_by_name: plan.registered_by_name || '',
      is_saved: true,
    })),
    // Normalize equipment structure to handle both old array and new object formats
    equipment: normalizeEquipmentStructure(autoSaveData.equipment),
    documents: extractComplexData('documents', []).map((doc: any) => ({
      ...doc,
      name: doc.name || doc.document_name || doc.file_name,
      type: doc.type || doc.document_type,
      uploaded_date: doc.uploaded_date || doc.created_at,
      // Prefer storage_path over file_path, and file_path over url (url may be a full URL)
      storage_path: doc.storage_path || doc.file_path || doc.url,
      file_path: doc.storage_path || doc.file_path || doc.url,
      notes: doc.notes || doc.description || '',
    }))
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
      client:clients(
        id,
        first_name,
        last_name,
        avatar_initials,
        date_of_birth,
        phone,
        address,
        email,
        additional_information,
        age_group,
        client_personal_info(
          emergency_contact_name,
          emergency_contact_phone,
          emergency_contact_relationship,
          preferred_communication,
          cultural_preferences,
          language_preferences,
          religion,
          marital_status,
          next_of_kin_name,
          next_of_kin_phone,
          next_of_kin_relationship,
          gp_name,
          gp_practice,
          gp_phone
        )
      ),
      goals:client_care_plan_goals(*),
      activities:client_activities(*),
      medications:client_medications(*),
      staff:staff!staff_id(
        id,
        first_name,
        last_name
      ),
      staff_assignments:care_plan_staff_assignments(
        id,
        staff_id,
        is_primary,
        staff:staff(id, first_name, last_name, specialization)
      )
    `)
    .eq('client_id', clientId)
    .in('status', ['pending_approval', 'pending_client_approval', 'approved', 'rejected', 'active']) // Include pending_client_approval for client view
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching client care plans with details:', error);
    throw error;
  }

  // Helper function to normalize personal info from multiple sources
  const normalizePersonalInfoForList = (autoSaveData: Record<string, any>, clientData: any) => {
    const personalInfoFromAutoSave = autoSaveData.personal_info || {};
    const clientPersonalInfo = clientData?.client_personal_info?.[0] || {};
    
    return {
      date_of_birth: personalInfoFromAutoSave.date_of_birth || clientData?.date_of_birth,
      phone: personalInfoFromAutoSave.phone || clientData?.phone,
      address: personalInfoFromAutoSave.address || clientData?.address,
      email: personalInfoFromAutoSave.email || clientData?.email,
      emergency_contact_name: personalInfoFromAutoSave.emergency_contact_name || clientPersonalInfo.emergency_contact_name,
      emergency_contact_phone: personalInfoFromAutoSave.emergency_contact_phone || clientPersonalInfo.emergency_contact_phone,
      emergency_contact_relationship: personalInfoFromAutoSave.emergency_contact_relationship || clientPersonalInfo.emergency_contact_relationship,
      preferred_communication: personalInfoFromAutoSave.preferred_communication || clientPersonalInfo.preferred_communication,
      cultural_preferences: personalInfoFromAutoSave.cultural_preferences || clientPersonalInfo.cultural_preferences,
      language_preferences: personalInfoFromAutoSave.language_preferences || clientPersonalInfo.language_preferences,
      religion: personalInfoFromAutoSave.religion || clientPersonalInfo.religion,
      marital_status: personalInfoFromAutoSave.marital_status || clientPersonalInfo.marital_status,
      next_of_kin_name: personalInfoFromAutoSave.next_of_kin_name || clientPersonalInfo.next_of_kin_name,
      next_of_kin_phone: personalInfoFromAutoSave.next_of_kin_phone || clientPersonalInfo.next_of_kin_phone,
      next_of_kin_relationship: personalInfoFromAutoSave.next_of_kin_relationship || clientPersonalInfo.next_of_kin_relationship,
      gp_name: personalInfoFromAutoSave.gp_name || clientPersonalInfo.gp_name,
      gp_practice: personalInfoFromAutoSave.gp_practice || clientPersonalInfo.gp_practice,
      gp_phone: personalInfoFromAutoSave.gp_phone || clientPersonalInfo.gp_phone,
      ...personalInfoFromAutoSave // Include any other fields from auto_save_data
    };
  };

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

    // Extract service plans from auto_save_data with complete field mapping
    const servicePlansFromAutoSave = Array.isArray(autoSaveData.service_plans) ? autoSaveData.service_plans.map((plan: any, index: number) => ({
      id: plan.id || `service-plan-${index}`,
      caption: plan.caption || '',
      service_id: plan.service_id || '',
      service_name: plan.service_name || plan.name || '',
      authority: plan.authority || '',
      authority_category: plan.authority_category || '',
      start_date: plan.start_date ? new Date(plan.start_date).toISOString().split('T')[0] : null,
      end_date: plan.end_date ? new Date(plan.end_date).toISOString().split('T')[0] : null,
      start_time: plan.start_time || '',
      end_time: plan.end_time || '',
      selected_days: plan.selected_days || [],
      frequency: plan.frequency || '',
      location: plan.location || '',
      note: plan.note || plan.notes || '',
      status: plan.status || 'active',
      registered_on: plan.registered_on,
      registered_by: plan.registered_by,
      registered_by_name: plan.registered_by_name || '',
      is_saved: true,
    })) : [];

    // Extract service actions from auto_save_data with complete field mapping
    const serviceActionsFromAutoSave = Array.isArray(autoSaveData.service_actions) ? autoSaveData.service_actions.map((action: any, index: number) => ({
      id: action.id || `service-action-${index}`,
      action_type: action.action_type || 'new',
      action_name: action.action_name || action.service_name || action.name || action.action || '',
      has_instructions: action.has_instructions || false,
      instructions: action.instructions || action.schedule_details || '',
      required_written_outcome: action.required_written_outcome || false,
      written_outcome: action.written_outcome || '',
      is_service_specific: action.is_service_specific || false,
      linked_service_id: action.linked_service_id || '',
      linked_service_name: action.linked_service_name || '',
      start_date: action.start_date ? new Date(action.start_date).toISOString().split('T')[0] : null,
      end_date: action.end_date ? new Date(action.end_date).toISOString().split('T')[0] : null,
      schedule_type: action.schedule_type || 'shift',
      shift_times: action.shift_times || [],
      start_time: action.start_time || '',
      end_time: action.end_time || '',
      selected_days: action.selected_days || [],
      frequency: action.frequency || '',
      notes: action.notes || '',
      status: action.status || 'active',
      registered_on: action.registered_on,
      registered_by: action.registered_by,
      registered_by_name: action.registered_by_name || '',
      is_saved: true,
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
      auto_save_data: autoSaveData, // Override with parsed version to satisfy type
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
      // Extract additional care plan details with normalized personal info
      personal_info: normalizePersonalInfoForList(autoSaveData, item.client),
      medical_info: autoSaveData.medical_info || {},
      personal_care: autoSaveData.personal_care || {},
      dietary_requirements: autoSaveData.dietary_requirements || autoSaveData.dietary || {},
      about_me: autoSaveData.about_me || {},
      risk_assessments: riskAssessmentsFromAutoSave,
      service_actions: serviceActionsFromAutoSave,
      service_plans: servicePlansFromAutoSave,
      equipment: normalizeEquipmentStructure(autoSaveData.equipment),
      documents: documentsFromAutoSave
    };
  });

  return transformedData;
};

const fetchCarerAssignedCarePlans = async (carerId: string): Promise<CarePlanWithDetails[]> => {
  console.log(`[fetchCarerAssignedCarePlans] Input carer ID (auth user ID): ${carerId}`);

  // First get the carer's staff record
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

  console.log(`[fetchCarerAssignedCarePlans] Staff ID: ${staffId}`);

  // Get client IDs from bookings assigned to this carer
  const { data: bookingsData, error: bookingsError } = await supabase
    .from('bookings')
    .select('client_id')
    .eq('staff_id', staffId)
    .not('client_id', 'is', null);

  if (bookingsError) {
    console.error('Error fetching carer bookings:', bookingsError);
    throw bookingsError;
  }

  // Extract unique client IDs
  const assignedClientIds = [...new Set(bookingsData?.map(b => b.client_id).filter(Boolean))];

  console.log(`[fetchCarerAssignedCarePlans] Assigned client IDs from bookings: ${assignedClientIds.length}`);

  if (assignedClientIds.length === 0) {
    return []; // No assigned clients via bookings, return empty
  }

  // Fetch care plans ONLY for clients the carer has bookings with
  const { data: carePlansData, error: carePlansError } = await supabase
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
    .in('client_id', assignedClientIds)
    .in('status', ['draft', 'active', 'pending_approval', 'approved', 'pending_client_approval'])
    .order('created_at', { ascending: false });

  if (carePlansError) {
    console.error('Error fetching care plans for assigned clients:', carePlansError);
    throw carePlansError;
  }

  const combinedData = carePlansData || [];

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
      auto_save_data: autoSaveData, // Override with parsed version to satisfy type
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
      equipment: normalizeEquipmentStructure(autoSaveData.equipment),
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

// Optimized version that accepts staffId and branchId directly
// Now also queries junction table for multi-staff assignments
export const useCarerAssignedCarePlansOptimized = (staffId: string, branchId: string) => {
  return useQuery({
    queryKey: ['carer-assigned-care-plans-optimized', staffId, branchId],
    queryFn: async (): Promise<CarePlanWithDetails[]> => {
      if (!staffId || !branchId) {
        console.log('[useCarerAssignedCarePlansOptimized] Missing staffId or branchId');
        return [];
      }

      console.log(`[useCarerAssignedCarePlansOptimized] Staff ID: ${staffId}, Branch ID: ${branchId}`);

      // Query 1: Care plans assigned directly via staff_id (backward compatibility)
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
          ),
          staff_assignments:care_plan_staff_assignments(
            id,
            staff_id,
            is_primary,
            staff:staff(id, first_name, last_name)
          )
        `)
        .eq('staff_id', staffId)
        .in('status', ['draft', 'active', 'pending_approval', 'approved', 'pending_client_approval']);

      // Query 2: Care plans assigned via junction table (multi-staff)
      const junctionQuery = supabase
        .from('care_plan_staff_assignments')
        .select(`
          care_plan_id,
          is_primary,
          care_plan:client_care_plans(
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
            ),
            staff_assignments:care_plan_staff_assignments(
              id,
              staff_id,
              is_primary,
              staff:staff(id, first_name, last_name)
            )
          )
        `)
        .eq('staff_id', staffId);

      // Query 3: Branch-level care plans where staff_id is null
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
          ),
          staff_assignments:care_plan_staff_assignments(
            id,
            staff_id,
            is_primary,
            staff:staff(id, first_name, last_name)
          )
        `)
        .eq('client.branch_id', branchId)
        .is('staff_id', null)
        .in('status', ['draft', 'active', 'pending_approval', 'approved', 'pending_client_approval']);

      const [directResult, junctionResult, branchResult] = await Promise.all([directQuery, junctionQuery, branchQuery]);

      if (directResult.error && junctionResult.error && branchResult.error) {
        console.error('Error fetching carer assigned care plans:', directResult.error || junctionResult.error || branchResult.error);
        throw directResult.error || junctionResult.error || branchResult.error;
      }

      // Extract care plans from junction query results
      const junctionCarePlans = (junctionResult.data || [])
        .filter((item: any) => item.care_plan && ['draft', 'active', 'pending_approval', 'approved', 'pending_client_approval'].includes(item.care_plan.status))
        .map((item: any) => item.care_plan);

      // Combine all results and deduplicate by care plan ID
      const carePlanMap = new Map();
      
      // Add direct results first (highest priority)
      (directResult.data || []).forEach((cp: any) => carePlanMap.set(cp.id, cp));
      
      // Add junction results (if not already present)
      junctionCarePlans.forEach((cp: any) => {
        if (!carePlanMap.has(cp.id)) carePlanMap.set(cp.id, cp);
      });
      
      // Add branch results last (lowest priority)
      (branchResult.data || []).forEach((cp: any) => {
        if (!carePlanMap.has(cp.id)) carePlanMap.set(cp.id, cp);
      });

      const combinedData = Array.from(carePlanMap.values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Transform the data
      const transformedData: CarePlanWithDetails[] = combinedData.map(item => {
        const autoSaveData = typeof item.auto_save_data === 'object' && item.auto_save_data !== null ? item.auto_save_data as Record<string, any> : {};
        
        const goalsFromAutoSave = Array.isArray(autoSaveData.goals) ? autoSaveData.goals.map((goal: any, index: number) => ({
          id: `goal-${index}`,
          description: goal.description || goal.goal_description || '',
          status: goal.status || 'active',
          progress: goal.progress || 0,
          notes: goal.notes || goal.additional_notes || ''
        })) : [];

        const medicationsFromAutoSave = Array.isArray(autoSaveData.medications) ? autoSaveData.medications.map((med: any, index: number) => ({
          id: `med-${index}`,
          name: med.medication_name || med.name || '',
          dosage: med.dosage || '',
          frequency: med.frequency || '',
          start_date: med.start_date || '',
          end_date: med.end_date || '',
          status: med.status || 'active'
        })) : [];

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
          goals: item.goals?.length > 0 ? item.goals : goalsFromAutoSave,
          medications: item.medications?.length > 0 ? item.medications : medicationsFromAutoSave,
          activities: item.activities?.length > 0 ? item.activities : activitiesFromAutoSave,
          care_plan_type: autoSaveData.care_plan_type || item.care_plan_type,
          priority: autoSaveData.priority || item.priority,
          review_date: autoSaveData.review_date || item.review_date,
          goals_progress: autoSaveData.goals_progress || item.goals_progress,
          notes: autoSaveData.notes || item.notes,
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
          isDirectlyAssigned: item.staff_id === staffId || (item.staff_assignments && item.staff_assignments.some((a: any) => a.staff_id === staffId)),
          staff_assignments: item.staff_assignments || []
        };
      });

      return transformedData;
    },
    enabled: Boolean(staffId) && Boolean(branchId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
