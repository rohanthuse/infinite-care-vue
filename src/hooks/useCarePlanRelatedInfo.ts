import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CarePlanRelatedInfo {
  // Background & Identity
  ethnicity?: string;
  religion?: string;
  sexual_orientation?: string;
  gender_identity?: string;
  nationality?: string;
  primary_language?: string;
  preferred_interpreter_language?: string;
  
  // My Home
  property_type?: string;
  living_arrangement?: string;
  key_safe_location?: string;
  pets?: string;
  home_accessibility?: string;
  parking_availability?: string;
  emergency_access?: string;
  
  // Accessibility & Communication
  interpreter_required?: boolean;
  vision_difficulties?: boolean;
  hearing_difficulties?: boolean;
  mobility_aids?: string;
  preferred_communication_method?: string;
  communication_aids?: string;
  sensory_impairment?: string;
  speech_difficulties?: boolean;
  cognitive_impairment?: boolean;
  
  // Do's & Don'ts
  likes_preferences?: string;
  dislikes_restrictions?: string;
  dos?: string;
  donts?: string;
  
  // GP Info
  gp_name?: string;
  gp_surgery_name?: string;
  gp_surgery_address?: string;
  gp_surgery_phone?: string;
  
  // Pharmacy Details
  pharmacy_name?: string;
  pharmacy_address?: string;
  pharmacy_phone?: string;
  
  // Desired Outcomes
  personal_goals?: string;
  desired_outcomes?: string;
  success_measures?: string;
  priority_areas?: string;
  
  // Metadata
  source: 'care_plan_draft' | 'care_plan';
  care_plan_id?: string;
  care_plan_status?: string;
}

interface CarePlanGoal {
  description?: string;
  target_date?: string | null;
  priority?: string;
  measurable_outcome?: string;
}

interface CarePlanAutoSaveData {
  about_me?: {
    has_key_safe?: string;
    key_safe_code?: string;
    home_type?: string;
    living_arrangement?: string;
    is_visually_impaired?: string;
    is_hearing_impaired?: string;
    requires_interpreter?: string;
    mobility?: string;
    communication_needs?: string;
    ethnicity?: string;
    likes?: string;
    dislikes?: string;
    dos?: string;
    donts?: string;
    pets?: string;
    // NEW: Background & Identity fields
    sexual_orientation?: string;
    gender_identity?: string;
    nationality?: string;
    primary_language?: string;
    preferred_interpreter_language?: string;
    religion?: string;
    // NEW: My Home fields
    home_accessibility?: string;
    parking_availability?: string;
    emergency_access?: string;
    // NEW: Accessibility fields
    sensory_impairment?: string;
    speech_difficulties?: string;
    cognitive_impairment?: string;
    communication_aids?: string;
  };
  gp_info?: {
    gp_name?: string;
    gp_phone?: string;
    gp_address?: string;
    surgery_name?: string;
  };
  pharmacy_info?: {
    pharmacy_name?: string;
    pharmacy_address?: string;
    pharmacy_phone?: string;
  };
  personal_info?: {
    religion?: string;
  };
  goals?: CarePlanGoal[];
}

const yesNoToBoolean = (value: string | boolean | undefined): boolean | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  const normalizedValue = String(value).toLowerCase().trim();
  if (normalizedValue === 'yes' || normalizedValue === 'true') return true;
  if (normalizedValue === 'no' || normalizedValue === 'false') return false;
  return undefined;
};

const fetchCarePlanRelatedInfo = async (clientId: string): Promise<CarePlanRelatedInfo | null> => {
  if (!clientId) return null;

  // Fetch the most recent non-archived care plan for this client
  const { data: carePlan, error } = await supabase
    .from('client_care_plans')
    .select('id, status, auto_save_data')
    .eq('client_id', clientId)
    .in('status', ['draft', 'pending_approval', 'pending_client_approval', 'active', 'approved'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[useCarePlanRelatedInfo] Error fetching care plan:', error);
    return null;
  }

  if (!carePlan || !carePlan.auto_save_data) {
    return null;
  }

  const autoSaveData = carePlan.auto_save_data as CarePlanAutoSaveData;
  const aboutMe = autoSaveData.about_me || {};
  const gpInfo = autoSaveData.gp_info || {};
  const pharmacyInfo = autoSaveData.pharmacy_info || {};
  const personalInfo = autoSaveData.personal_info || {};
  const goals = autoSaveData.goals || [];

  const isDraft = carePlan.status === 'draft' || carePlan.status === 'pending_approval' || carePlan.status === 'pending_client_approval';

  // Transform goals array into flat text fields for Desired Outcomes
  const personalGoals = goals
    .filter(g => g.description)
    .map((g, i) => `${i + 1}. ${g.description}`)
    .join('\n') || undefined;

  const successMeasures = goals
    .filter(g => g.measurable_outcome)
    .map((g, i) => `${i + 1}. ${g.measurable_outcome}`)
    .join('\n') || undefined;

  const priorityAreas = goals
    .filter(g => g.priority === 'high' && g.description)
    .map((g, i) => `${i + 1}. ${g.description}`)
    .join('\n') || undefined;

  const desiredOutcomes = goals.length > 0 
    ? `${goals.length} care goal(s) defined in Care Plan` 
    : undefined;

  return {
    // Background & Identity
    ethnicity: aboutMe.ethnicity || undefined,
    religion: aboutMe.religion || personalInfo.religion || undefined,
    sexual_orientation: aboutMe.sexual_orientation || undefined,
    gender_identity: aboutMe.gender_identity || undefined,
    nationality: aboutMe.nationality || undefined,
    primary_language: aboutMe.primary_language || undefined,
    preferred_interpreter_language: aboutMe.preferred_interpreter_language || undefined,
    
    // My Home
    property_type: aboutMe.home_type || undefined,
    living_arrangement: aboutMe.living_arrangement || (aboutMe as any).living_status || undefined,
    key_safe_location: aboutMe.key_safe_code || undefined,
    pets: aboutMe.pets || undefined,
    home_accessibility: aboutMe.home_accessibility || undefined,
    parking_availability: aboutMe.parking_availability || undefined,
    emergency_access: aboutMe.emergency_access || undefined,
    
    // Accessibility & Communication
    interpreter_required: yesNoToBoolean(aboutMe.requires_interpreter),
    vision_difficulties: yesNoToBoolean(aboutMe.is_visually_impaired),
    hearing_difficulties: yesNoToBoolean(aboutMe.is_hearing_impaired),
    mobility_aids: aboutMe.mobility || undefined,
    preferred_communication_method: aboutMe.communication_needs || undefined,
    sensory_impairment: aboutMe.sensory_impairment || undefined,
    speech_difficulties: yesNoToBoolean(aboutMe.speech_difficulties),
    cognitive_impairment: yesNoToBoolean(aboutMe.cognitive_impairment),
    communication_aids: aboutMe.communication_aids || undefined,
    
    // Do's & Don'ts
    likes_preferences: aboutMe.likes || undefined,
    dislikes_restrictions: aboutMe.dislikes || undefined,
    dos: aboutMe.dos || undefined,
    donts: aboutMe.donts || undefined,
    
    // GP Info
    gp_name: gpInfo.gp_name || undefined,
    gp_surgery_name: gpInfo.surgery_name || undefined,
    gp_surgery_address: gpInfo.gp_address || undefined,
    gp_surgery_phone: gpInfo.gp_phone || undefined,
    
    // Pharmacy Details
    pharmacy_name: pharmacyInfo.pharmacy_name || undefined,
    pharmacy_address: pharmacyInfo.pharmacy_address || undefined,
    pharmacy_phone: pharmacyInfo.pharmacy_phone || undefined,
    
    // Desired Outcomes
    personal_goals: personalGoals,
    desired_outcomes: desiredOutcomes,
    success_measures: successMeasures,
    priority_areas: priorityAreas,
    
    // Metadata
    source: isDraft ? 'care_plan_draft' : 'care_plan',
    care_plan_id: carePlan.id,
    care_plan_status: carePlan.status,
  };
};

export const useCarePlanRelatedInfo = (clientId: string) => {
  return useQuery({
    queryKey: ['care-plan-related-info', clientId],
    queryFn: () => fetchCarePlanRelatedInfo(clientId),
    enabled: Boolean(clientId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
