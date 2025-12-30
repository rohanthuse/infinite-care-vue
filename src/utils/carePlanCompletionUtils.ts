/**
 * Unified care plan completion calculation utilities.
 * Used by both useCarePlanDraft.ts (for database storage) and CarePlanCreationWizard.tsx (for UI display).
 * This ensures consistent completion percentages and step tick marks across the application.
 */

// Helper function to check if a value is a non-empty string
export const isNonEmptyString = (value: any): boolean => {
  return typeof value === 'string' && value.trim().length > 0;
};

// Helper function to check if an object has any meaningful values
export const hasAnyValue = (obj: any): boolean => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  
  return Object.values(obj).some(value => {
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'boolean') return value === true;
    if (Array.isArray(value)) return value.length > 0 && value.some(item => item && (typeof item === 'string' ? item.trim() : true));
    if (typeof value === 'object' && value !== null) return hasAnyValue(value);
    return value !== null && value !== undefined && value !== '';
  });
};

// Check if personal info step has meaningful data
export const hasPersonalInfo = (personalInfo: any): boolean => {
  if (!personalInfo || typeof personalInfo !== 'object') return false;
  
  const meaningfulFields = [
    'first_name', 'last_name', 'date_of_birth', 'gender', 'ethnicity',
    'nationality', 'language', 'religion', 'marital_status', 'address',
    'phone', 'email', 'emergency_contact_name', 'emergency_contact_phone',
    'gp_name', 'gp_address', 'gp_phone', 'client_name', 'client_email', 'client_phone'
  ];
  
  return meaningfulFields.some(field => isNonEmptyString(personalInfo[field]));
};

// Check if about me step has meaningful data
export const hasAboutMe = (aboutMe: any): boolean => {
  if (!aboutMe || typeof aboutMe !== 'object') return false;
  
  // Check for specific about_me fields
  const aboutMeFields = [
    'likes', 'dislikes', 'hobbies', 'background', 'preferences',
    'daily_routine', 'communication_preferences', 'cultural_needs',
    'spiritual_needs', 'social_preferences', 'important_people',
    'life_history', 'occupation', 'interests'
  ];
  
  const hasSpecificFields = aboutMeFields.some(field => isNonEmptyString(aboutMe[field]));
  
  // Fallback to generic check if no specific fields
  return hasSpecificFields || hasAnyValue(aboutMe);
};

// Check if medical info / diagnosis step has meaningful data
export const hasMedicalInfo = (medicalInfo: any): boolean => {
  if (!medicalInfo || typeof medicalInfo !== 'object') return false;
  
  // Check for medical conditions arrays
  if (Array.isArray(medicalInfo.physical_health_conditions) && medicalInfo.physical_health_conditions.length > 0) return true;
  if (Array.isArray(medicalInfo.mental_health_conditions) && medicalInfo.mental_health_conditions.length > 0) return true;
  
  // Check for medications in medication_manager
  if (medicalInfo.medication_manager?.medications && 
      Array.isArray(medicalInfo.medication_manager.medications) && 
      medicalInfo.medication_manager.medications.length > 0) return true;
  
  // Check for other medical fields
  const medicalFields = ['allergies', 'current_medications', 'medical_history', 'service_band'];
  return medicalFields.some(field => isNonEmptyString(medicalInfo[field]));
};

// Check if NEWS2 health monitoring has data
export const hasNews2Monitoring = (medicalInfo: any): boolean => {
  if (!medicalInfo || typeof medicalInfo !== 'object') return false;
  
  const news2 = medicalInfo.news2_monitoring;
  if (!news2 || typeof news2 !== 'object') return false;
  
  // Check if any NEWS2 field has a meaningful value
  return hasAnyValue(news2);
};

// Check if medication schedule has medications
export const hasMedicationSchedule = (medicalInfo: any): boolean => {
  if (!medicalInfo || typeof medicalInfo !== 'object') return false;
  
  return medicalInfo.medication_manager?.medications && 
         Array.isArray(medicalInfo.medication_manager.medications) && 
         medicalInfo.medication_manager.medications.length > 0;
};

// Check if medication administration has data
export const hasMedicationAdministration = (formData: any): boolean => {
  // Check dedicated admin_medication field
  if (formData.admin_medication && hasAnyValue(formData.admin_medication)) return true;
  
  // Also check if medications have administration details
  const medications = formData.medical_info?.medication_manager?.medications;
  if (Array.isArray(medications) && medications.length > 0) {
    return medications.some((med: any) => 
      med.administration_route || med.instructions || med.special_instructions
    );
  }
  
  return false;
};

// Check if consent step has meaningful data
export const hasConsentInfo = (consent: any): boolean => {
  if (!consent || typeof consent !== 'object') return false;
  
  // Check for any consent responses (yes/no selections)
  const consentFields = [
    'discuss_health_and_risks', 'medication_support_consent', 'care_plan_importance_understood',
    'share_info_with_professionals', 'regular_reviews_understood', 'may_need_capacity_assessment',
    'consent_to_care_and_support', 'consent_to_personal_care', 'consent_to_medication_administration',
    'consent_to_healthcare_professionals', 'consent_to_emergency_services', 'consent_to_data_sharing',
    'consent_to_care_plan_changes'
  ];
  
  const hasConsentAnswers = consentFields.some(field => consent[field] === 'yes' || consent[field] === 'no');
  
  // Check for capacity assessment fields
  const hasCapacityInfo = consent.has_capacity === true || consent.lacks_capacity === true;
  
  // Check for text fields
  const textFields = ['typed_full_name', 'extra_information', 'capacity_notes', 'best_interest_notes'];
  const hasTextInfo = textFields.some(field => isNonEmptyString(consent[field]));
  
  return hasConsentAnswers || hasCapacityInfo || hasTextInfo;
};

// Check if risk assessments have meaningful data
export const hasRiskAssessments = (formData: any): boolean => {
  // Check main risk assessments array
  if (Array.isArray(formData.risk_assessments) && formData.risk_assessments.length > 0) return true;
  
  // Check individual risk assessment objects for any meaningful data
  const riskObjects = [
    formData.risk_equipment_dietary,
    formData.risk_medication,
    formData.risk_dietary_food,
    formData.risk_warning_instructions,
    formData.risk_choking,
    formData.risk_pressure_damage
  ];
  
  return riskObjects.some(riskObj => {
    if (!riskObj || typeof riskObj !== 'object') return false;
    
    return Object.values(riskObj).some(value => {
      if (typeof value === 'boolean') return value === true;
      if (typeof value === 'string') return (value as string).trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return false;
    });
  });
};

// Check if equipment step has meaningful data
export const hasEquipment = (equipment: any): boolean => {
  if (!equipment || typeof equipment !== 'object') return false;
  
  // Handle array format (old format)
  if (Array.isArray(equipment) && equipment.length > 0) return true;
  
  // Handle object format (new format)
  return (
    (Array.isArray(equipment.equipment_blocks) && equipment.equipment_blocks.length > 0) ||
    (equipment.moving_handling && hasAnyValue(equipment.moving_handling)) ||
    (equipment.environment_checks && hasAnyValue(equipment.environment_checks)) ||
    (equipment.home_repairs && hasAnyValue(equipment.home_repairs))
  );
};

// Check if key contacts have meaningful data
export const hasKeyContacts = (formData: any): boolean => {
  const personalInfo = formData.personal_info;
  
  // Check emergency contacts in personal info
  if (personalInfo?.emergency_contacts && 
      Array.isArray(personalInfo.emergency_contacts) && 
      personalInfo.emergency_contacts.length > 0) return true;
  
  // Check dedicated key_contacts field
  if (formData.key_contacts && 
      Array.isArray(formData.key_contacts) && 
      formData.key_contacts.length > 0) return true;
  
  return false;
};

/**
 * Get array of completed step IDs based on form data.
 * This is the single source of truth for step completion.
 * 
 * @param formData - The care plan form data
 * @param isChild - Whether the client is a child/young person
 * @returns Array of completed step IDs
 */
export const getCompletedStepIds = (formData: any, isChild: boolean = false): number[] => {
  if (!formData) return [];
  
  const completedSteps: number[] = [];
  const medInfo = formData.medical_info;

  // Step 1 - Basic Info (title is required)
  if (isNonEmptyString(formData.title)) completedSteps.push(1);
  
  // Step 2 - About Me
  if (hasAboutMe(formData.about_me)) completedSteps.push(2);
  
  // Step 3 - Diagnosis / Medical Info
  if (hasMedicalInfo(medInfo)) completedSteps.push(3);
  
  // Step 4 - NEWS2 Health Monitoring
  if (hasNews2Monitoring(medInfo)) completedSteps.push(4);
  
  // Step 5 - Medication Schedule
  if (hasMedicationSchedule(medInfo)) completedSteps.push(5);
  
  // Step 6 - Medication (administration details)
  if (hasMedicationAdministration(formData)) completedSteps.push(6);
  
  // Step 7 - Goals
  if (Array.isArray(formData.goals) && formData.goals.length > 0) completedSteps.push(7);
  
  // Step 8 - Activities
  if (Array.isArray(formData.activities) && formData.activities.length > 0) completedSteps.push(8);
  
  // Step 9 - Personal Care
  if (hasAnyValue(formData.personal_care)) completedSteps.push(9);
  
  // Step 10 - Dietary
  if (hasAnyValue(formData.dietary)) completedSteps.push(10);
  
  // Step 11 - Risk Assessments
  if (hasRiskAssessments(formData)) completedSteps.push(11);
  
  // Step 12 - Equipment
  if (hasEquipment(formData.equipment)) completedSteps.push(12);
  
  // Step 13 - Service Plans
  if (Array.isArray(formData.service_plans) && formData.service_plans.length > 0) completedSteps.push(13);
  
  // Step 14 - Service Actions
  if (Array.isArray(formData.service_actions) && formData.service_actions.length > 0) completedSteps.push(14);
  
  // Step 15 - Documents
  if (Array.isArray(formData.documents) && formData.documents.length > 0) completedSteps.push(15);
  
  // Step 16 - Consent
  if (hasConsentInfo(formData.consent)) completedSteps.push(16);
  
  // Step 17 - Key Contacts
  if (hasKeyContacts(formData)) completedSteps.push(17);
  
  // Child-specific steps (18-20) - only evaluated for children
  if (isChild) {
    const behaviorSupport = formData.behavior_support;
    const childInfo = formData.child_info;
    const safeguarding = formData.safeguarding;
    
    // Step 18 - Behavior Support
    if (behaviorSupport && hasAnyValue(behaviorSupport)) completedSteps.push(18);
    
    // Step 19 - Education & Development
    if (childInfo && (
      isNonEmptyString(childInfo.education_placement) ||
      isNonEmptyString(childInfo.daily_learning_goals) ||
      isNonEmptyString(childInfo.independence_skills)
    )) completedSteps.push(19);
    
    // Step 20 - Safeguarding & Risks
    if (safeguarding && hasAnyValue(safeguarding)) completedSteps.push(20);
  }
  
  // Step 21 - Review is NOT auto-marked (only on explicit submission)
  
  return completedSteps;
};

/**
 * Calculate completion percentage based on form data.
 * This is the single source of truth for completion percentage.
 * 
 * @param formData - The care plan form data
 * @param isChild - Whether the client is a child/young person
 * @returns Completion percentage (0-100)
 */
export const calculateCompletionPercentage = (formData: any, isChild: boolean = false): number => {
  if (!formData) return 0;
  
  const completedSteps = getCompletedStepIds(formData, isChild);
  
  // Total countable steps (excluding Review step 21)
  // For children: 20 steps (1-20)
  // For adults: 17 steps (1-17, excluding child-only steps 18-20)
  const totalSteps = isChild ? 20 : 17;
  
  return Math.round((completedSteps.length / totalSteps) * 100);
};
