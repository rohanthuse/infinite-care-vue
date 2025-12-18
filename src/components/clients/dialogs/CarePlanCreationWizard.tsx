
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { User } from "lucide-react";
import { CarePlanWizardSidebar } from "./wizard/CarePlanWizardSidebar";
import { CarePlanWizardSteps } from "./wizard/CarePlanWizardSteps";
import { CarePlanWizardFooter } from "./wizard/CarePlanWizardFooter";
import { useCarePlanDraft } from "@/hooks/useCarePlanDraft";
import { useCarePlanCreation } from "@/hooks/useCarePlanCreation";
import { useClientProfile } from "@/hooks/useClientData";
import { toast } from "sonner";

const carePlanSchema = z.object({
  title: z.string().min(1, "Title is required"),
  provider_name: z.string().optional(),
  provider_type: z.string().optional(),
  start_date: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  care_plan_type: z.string().optional(),
  personal_info: z.any().optional(),
  about_me: z.any().optional(),
  general: z.object({
    main_reasons_for_care: z.string().optional().default(""),
    used_other_care_providers: z.boolean().optional().default(false),
    fallen_past_six_months: z.boolean().optional().default(false),
    has_assistance_device: z.boolean().optional().default(false),
    arrange_assistance_device: z.boolean().optional().default(false),
    bereavement_past_two_years: z.boolean().optional().default(false),
    warnings: z.array(z.string()).optional().default([]),
    instructions: z.array(z.string()).optional().default([]),
    important_occasions: z.array(
      z.object({
        occasion: z.string().optional().default(""),
        date: z.string().optional().default(""),
      })
    ).optional().default([]),
  }).optional(),
  // ... keep existing medical, dietary, risk, equipment, service, consent fields ...
  medical_info: z.any().optional(),
  goals: z.array(z.any()).optional(),
  activities: z.array(z.any()).optional(),
  personal_care: z.any().optional(),
  dietary: z.any().optional(),
  risk_assessments: z.array(z.any()).optional(),
  risk_equipment_dietary: z.any().optional(),
  risk_medication: z.any().optional(),
  risk_dietary_food: z.any().optional(),
  risk_warning_instructions: z.any().optional(),
  risk_choking: z.any().optional(),
  risk_pressure_damage: z.any().optional(),
  equipment: z.any().optional(),
  service_plans: z.array(z.any()).optional(),
  service_actions: z.array(z.any()).optional(),
  documents: z.array(z.any()).optional(),
  consent: z.any().optional(),
  
  // Child-specific fields
  child_info: z.object({
    legal_status: z.enum(['care_order', 'voluntary', 'other']).optional(),
    legal_status_other: z.string().optional(),
    social_worker_name: z.string().optional(),
    social_worker_contact: z.string().optional(),
    social_worker_email: z.string().optional(),
    primary_communication: z.enum(['verbal', 'pecs', 'makaton', 'aac', 'other']).optional(),
    primary_communication_other: z.string().optional(),
    key_words_phrases: z.string().optional(),
    preferred_communication_approach: z.string().optional(),
    communication_triggers: z.string().optional(),
    calming_techniques: z.string().optional(),
    toileting_needs: z.string().optional(),
    dressing_support: z.string().optional(),
    eating_drinking_support: z.enum(['independent', 'prompted', 'assisted', 'peg']).optional(),
    hygiene_routines: z.string().optional(),
    independence_level: z.enum(['independent', 'with_prompts', 'needs_full_support']).optional(),
    education_placement: z.string().optional(),
    ehcp_targets_linked: z.boolean().optional(),
    daily_learning_goals: z.string().optional(),
    independence_skills: z.string().optional(),
    social_skills_development: z.string().optional(),
  }).optional(),
  
  behavior_support: z.object({
    challenging_behaviors: z.string().optional(),
    behavior_triggers: z.string().optional(),
    early_warning_signs: z.string().optional(),
    preventative_strategies: z.string().optional(),
    crisis_management_plan: z.string().optional(),
    post_incident_protocol: z.string().optional(),
  }).optional(),
  
  safeguarding: z.object({
    risk_assessment: z.string().optional(),
    safety_plan: z.string().optional(),
    protection_measures: z.string().optional(),
    escalation_procedures: z.string().optional(),
    review_frequency: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
  
  additional_notes: z.string().optional(),
});

interface CarePlanCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  carePlanId?: string;
  isEditingChangeRequest?: boolean;
  changeRequestData?: {
    comments?: string;
    requestedAt?: string;
    requestedBy?: string;
  } | null;
}

const wizardSteps = [
  { id: 1, name: "Basic Information", description: "Care plan details and personal information" },
  { id: 2, name: "About Me", description: "Client preferences and background" },
  { id: 3, name: "Diagnosis", description: "Health conditions and medications" },
  { id: 4, name: "NEWS2 Health Monitoring", description: "Vital signs monitoring configuration" },
  { id: 5, name: "Medication Schedule", description: "Medication management and calendar" },
  { id: 6, name: "Medication", description: "Medication administration details" },
  { id: 7, name: "Goals", description: "Care goals and objectives" },
  { id: 8, name: "Activities", description: "Daily activities and routines" },
  { id: 9, name: "Personal Care", description: "Personal care requirements" },
  { id: 10, name: "Dietary", description: "Dietary needs and restrictions" },
  { id: 11, name: "Risk Assessments", description: "Safety and risk evaluations" },
  { id: 12, name: "Equipment", description: "Required equipment and aids" },
  { id: 13, name: "Service Plans", description: "Service delivery plans" },
  { id: 14, name: "Service Actions", description: "Specific service actions" },
  { id: 15, name: "Documents", description: "Supporting documents" },
  { id: 16, name: "Consent", description: "Consent and capacity assessment" },
  { id: 17, name: "Key Contacts", description: "Emergency and family contacts" },
  // Child-specific steps (only shown for children/young persons) - placed before Review
  { id: 18, name: "Behavior Support", description: "Challenging behaviors and crisis management", childOnly: true },
  { id: 19, name: "Education & Development", description: "Educational placement and development goals", childOnly: true },
  { id: 20, name: "Safeguarding & Risks", description: "Safeguarding assessments and risk plans", childOnly: true },
  // Review is now last
  { id: 21, name: "Review", description: "Review and finalize care plan" },
];

// Safe array initialization helper
const initializeArrayField = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  // If it's an object, convert to empty array to prevent errors
  return [];
};

// Safe object initialization helper
const initializeObjectField = (value: any): any => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  return {};
};

export function CarePlanCreationWizard({
  isOpen,
  onClose,
  clientId,
  carePlanId,
  isEditingChangeRequest = false,
  changeRequestData = null
}: CarePlanCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [clientDataLoaded, setClientDataLoaded] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  
  // Fetch client profile data first
  const { data: clientProfile, isLoading: isClientLoading } = useClientProfile(clientId);
  
  // Determine if client is a child/young person
  const isChild = React.useMemo(() => {
    return clientProfile?.age_group === 'child' || clientProfile?.age_group === 'young_person';
  }, [clientProfile?.age_group]);
  
  // Filter steps based on client age group - using useMemo for reactivity
  const filteredSteps = React.useMemo(() => {
    if (!isChild) {
      return wizardSteps.filter(step => !step.childOnly);
    }
    return wizardSteps; // Show all steps for children/young persons
  }, [isChild]);
  
  const totalSteps = filteredSteps.length;
  
  const form = useForm({
    resolver: zodResolver(carePlanSchema),
    defaultValues: {
      title: "",
      provider_name: "",
      provider_type: "staff",
      staff_id: null,
      start_date: new Date().toISOString().split('T')[0],
      priority: "medium" as const,
      care_plan_type: "standard",
      personal_info: {},
      about_me: {},
      general: {},
      medical_info: {
        medication_manager: {
          medications: [],
          applicable: true
        }
      },
      goals: [],
      activities: [],
      personal_care: {},
      dietary: {},
      risk_assessments: [],
      risk_equipment_dietary: {},
      risk_medication: {},
      risk_dietary_food: {},
      risk_warning_instructions: {},
      risk_choking: {},
      risk_pressure_damage: {},
      equipment: {
        equipment_blocks: [],
        moving_handling: {},
        environment_checks: {},
        home_repairs: {
          repair_needed: "",
          repair_other: "",
          contact_name: "",
          contact_telephone: "",
        },
      },
      service_plans: [],
      service_actions: [],
      documents: [],
      consent: {},
      additional_notes: "",
    },
  });

  // forceNew = true when no carePlanId is provided (creating a new care plan)
  // This prevents auto-loading of existing drafts for the client
  const forceNew = !carePlanId;
  
  const { 
    draftData, 
    isDraftLoading, 
    isCheckingExistingDraft,
    saveDraft, 
    autoSave, 
    isSaving,
    savedCarePlanId,
  } = useCarePlanDraft(clientId, carePlanId, forceNew);

  // Effective care plan ID for database operations
  const effectiveCarePlanId = savedCarePlanId || carePlanId;

  const { createCarePlan, isCreating } = useCarePlanCreation();

  // Reset form state when dialog opens for a NEW care plan (no carePlanId)
  useEffect(() => {
    if (isOpen && !carePlanId) {
      console.log('Resetting form for new care plan - clientId:', clientId);
      setClientDataLoaded(false);
      setCurrentStep(1);
      setStepError(null);
      
      // Reset form to clean default values
      form.reset({
        title: "",
        provider_name: "",
        provider_type: "staff",
        staff_id: null,
        start_date: new Date().toISOString().split('T')[0],
        priority: "medium" as const,
        care_plan_type: "standard",
        personal_info: {},
        about_me: {},
        general: {},
        medical_info: {
          medication_manager: {
            medications: [],
            applicable: true
          }
        },
        goals: [],
        activities: [],
        personal_care: {},
        dietary: {},
        risk_assessments: [],
        risk_equipment_dietary: {},
        risk_medication: {},
        risk_dietary_food: {},
        risk_warning_instructions: {},
        risk_choking: {},
        risk_pressure_damage: {},
        equipment: {
          equipment_blocks: [],
          moving_handling: {},
          environment_checks: {},
          home_repairs: {
            repair_needed: "",
            repair_other: "",
            contact_name: "",
            contact_telephone: "",
          },
        },
        service_plans: [],
        service_actions: [],
        documents: [],
        consent: {},
        additional_notes: "",
      });
    }
  }, [isOpen, carePlanId, clientId, form]);

  // Debug logging for form state
  useEffect(() => {
    if (isOpen) {
      console.log('CarePlanCreationWizard opened:', {
        currentStep,
        clientId,
        carePlanId,
        formValues: form.getValues()
      });
    }
  }, [isOpen, currentStep, clientId, carePlanId, form]);

  // Pre-populate form with client data when client profile is loaded
  useEffect(() => {
    if (clientProfile && !isDraftLoading && !clientDataLoaded) {
      console.log('Pre-populating form with client data:', clientProfile);
      
      try {
        // Only set values if they don't already exist (don't overwrite draft data)
        const currentPersonalInfo = form.getValues('personal_info') || {};
        
        const updatedPersonalInfo: any = {
          ...currentPersonalInfo,
        };

        // Add basic client information if not already present
        if (clientProfile.first_name && clientProfile.last_name && !updatedPersonalInfo.client_name) {
          updatedPersonalInfo.client_name = `${clientProfile.first_name} ${clientProfile.last_name}`;
        }
        if (clientProfile.email && !updatedPersonalInfo.client_email) {
          updatedPersonalInfo.client_email = clientProfile.email;
        }
        if (clientProfile.phone && !updatedPersonalInfo.client_phone) {
          updatedPersonalInfo.client_phone = clientProfile.phone;
        }
        if (clientProfile.address && !updatedPersonalInfo.client_address) {
          updatedPersonalInfo.client_address = clientProfile.address;
        }

        // Set the updated personal info
        form.setValue('personal_info', updatedPersonalInfo);
        
        // Pre-populate other basic info if available
        const currentTitle = form.getValues('title');
        if (!currentTitle && clientProfile.first_name && clientProfile.last_name) {
          form.setValue('title', `Care Plan for ${clientProfile.first_name} ${clientProfile.last_name}`);
        }

        setClientDataLoaded(true);
        console.log('Client data pre-populated successfully');
      } catch (error) {
        console.error('Error pre-populating client data:', error);
        setStepError('Failed to load client data');
      }
    }
  }, [clientProfile, isDraftLoading, clientDataLoaded, form]);

  // Load draft data when available (this should run after client data is loaded)
  useEffect(() => {
    if (draftData?.auto_save_data && !isDraftLoading && clientDataLoaded) {
      const savedData = draftData.auto_save_data;
      
      console.log('Loading draft data:', savedData);
      
      try {
        // Safely set form values from saved data with proper type handling
        Object.keys(savedData).forEach((key) => {
          if (savedData[key] !== undefined) {
            let value = savedData[key];
            
            // Handle array fields with safety checks
            if (['risk_assessments', 'service_plans', 'service_actions', 'documents', 'goals', 'activities'].includes(key)) {
              value = initializeArrayField(value);
            }
            // Handle equipment field specially to preserve backward compatibility
            else if (key === 'equipment') {
              if (Array.isArray(value)) {
                // Old format - convert to new format
                value = {
                  equipment_blocks: value,
                  moving_handling: {},
                  environment_checks: {},
                  home_repairs: {
                    repair_needed: "",
                    repair_other: "",
                    contact_name: "",
                    contact_telephone: "",
                  },
                };
              } else if (!value || typeof value !== 'object') {
                value = {
                  equipment_blocks: [],
                  moving_handling: {},
                  environment_checks: {},
                  home_repairs: {
                    repair_needed: "",
                    repair_other: "", 
                    contact_name: "",
                    contact_telephone: "",
                  },
                };
              }
            }
            // Handle object fields with safety checks
            else if (['personal_info', 'about_me', 'general', 'medical_info', 'personal_care', 'dietary', 'risk_equipment_dietary', 'risk_medication', 'risk_dietary_food', 'risk_warning_instructions', 'risk_choking', 'risk_pressure_damage', 'consent'].includes(key)) {
              value = initializeObjectField(value);
            }
            
            form.setValue(key as any, value);
          }
        });

        // Set current step from saved data with backward compatibility for new steps
        if (draftData.last_step_completed) {
          let adjustedStep = draftData.last_step_completed;
          
          // If draft was saved before General step was added (step 4), adjust step numbers
          if (savedData && typeof savedData === 'object' && !Array.isArray(savedData) && !savedData.general && adjustedStep >= 4) {
            adjustedStep += 1; // Shift forward to account for new General step at position 4
          }
          
          
          // If draft was saved before Admin Medication step was added (step 7 after General and Hobbies insertion), adjust step numbers
          if (savedData && typeof savedData === 'object' && !Array.isArray(savedData) && 
              savedData.medical_info && typeof savedData.medical_info === 'object' && 
              !Array.isArray(savedData.medical_info) && !savedData.medical_info.admin_medication && 
              adjustedStep >= 7) {
            adjustedStep += 1; // Shift forward to account for new Admin Medication step
          }
          
          setCurrentStep(adjustedStep);
        }
        
        console.log('Draft data loaded successfully');
        setStepError(null);
      } catch (error) {
        console.error('Error loading draft data:', error);
        setStepError('Failed to load saved data');
      }
    }
  }, [draftData, isDraftLoading, clientDataLoaded, form]);

  // Auto-save on form changes
  useEffect(() => {
    const subscription = form.watch((data) => {
      if (isOpen && savedCarePlanId && clientDataLoaded) {
        try {
          autoSave(data, currentStep);
        } catch (error) {
          console.error('Auto-save error:', error);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, autoSave, currentStep, isOpen, savedCarePlanId, clientDataLoaded]);

  // Helper functions for step completion validation
  const isNonEmptyString = (value: any): boolean => {
    return typeof value === 'string' && value.trim().length > 0;
  };

  const hasAnyValue = (obj: any): boolean => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
    
    return Object.values(obj).some(value => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'boolean') return value === true;
      if (Array.isArray(value)) return value.length > 0 && value.some(item => item && (typeof item === 'string' ? item.trim() : true));
      if (typeof value === 'object' && value !== null) return hasAnyValue(value);
      return value !== null && value !== undefined && value !== '';
    });
  };

  const hasPersonalInfo = (personalInfo: any): boolean => {
    if (!personalInfo || typeof personalInfo !== 'object') return false;
    
    // Check for any meaningful personal information fields
    const meaningfulFields = [
      'first_name', 'last_name', 'date_of_birth', 'gender', 'ethnicity',
      'nationality', 'language', 'religion', 'marital_status', 'address',
      'phone', 'email', 'emergency_contact_name', 'emergency_contact_phone',
      'gp_name', 'gp_address', 'gp_phone'
    ];
    
    return meaningfulFields.some(field => isNonEmptyString(personalInfo[field]));
  };

  const hasMedicalInfo = (medicalInfo: any): boolean => {
    if (!medicalInfo || typeof medicalInfo !== 'object') return false;
    
    // Check for medical conditions
    if (Array.isArray(medicalInfo.physical_health_conditions) && medicalInfo.physical_health_conditions.length > 0) return true;
    if (Array.isArray(medicalInfo.mental_health_conditions) && medicalInfo.mental_health_conditions.length > 0) return true;
    
    // Check for medications
    if (medicalInfo.medication_manager?.medications && Array.isArray(medicalInfo.medication_manager.medications) && medicalInfo.medication_manager.medications.length > 0) return true;
    
    // Check for other medical fields
    const medicalFields = ['allergies', 'current_medications', 'medical_history', 'service_band'];
    return medicalFields.some(field => isNonEmptyString(medicalInfo[field]));
  };


  const hasConsentInfo = (consent: any): boolean => {
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

  const hasRiskAssessments = (formData: any): boolean => {
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
        if (typeof value === 'string') return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        return false;
      });
    });
  };

  // Calculate completed steps based on form data
  const getCompletedSteps = () => {
    try {
      const formData = form.getValues();
      const completedSteps: number[] = [];

      // Check each step for completion with proper validation
      // Step 1 - Basic Info
      if (formData.title?.trim()) completedSteps.push(1);
      // Step 2 - About Me
      if (hasAnyValue(formData.about_me)) completedSteps.push(2);
      // Step 3 - Medical Info
      if (hasMedicalInfo(formData.medical_info)) completedSteps.push(3);
      // Step 4 - Medication (check if medical_info has medication data)
      if (formData.medical_info && hasAnyValue(formData.medical_info)) completedSteps.push(4);
      // Step 5 - Admin Medication (only mark complete if user has entered admin medication details)
      // Check for any admin medication related data in medical_info or separate fields
      if ((formData as any).admin_medication && hasAnyValue((formData as any).admin_medication)) completedSteps.push(5);
      // Step 6 - Goals
      if (Array.isArray(formData.goals) && formData.goals.length > 0) completedSteps.push(6);
      // Step 7 - Activities
      if (Array.isArray(formData.activities) && formData.activities.length > 0) completedSteps.push(7);
      // Step 8 - Personal Care
      if (hasAnyValue(formData.personal_care)) completedSteps.push(8);
      // Step 9 - Dietary
      if (hasAnyValue(formData.dietary)) completedSteps.push(9);
      // Step 10 - Risk Assessments
      if (hasRiskAssessments(formData)) completedSteps.push(10);
      // Step 11 - Equipment
      if (formData.equipment && typeof formData.equipment === 'object' && (
        (Array.isArray(formData.equipment.equipment_blocks) && formData.equipment.equipment_blocks.length > 0) ||
        (formData.equipment.moving_handling && hasAnyValue(formData.equipment.moving_handling)) ||
        (formData.equipment.environment_checks && hasAnyValue(formData.equipment.environment_checks)) ||
        (formData.equipment.home_repairs && hasAnyValue(formData.equipment.home_repairs))
      )) completedSteps.push(11);
      // Step 12 - Service Plans
      if (Array.isArray(formData.service_plans) && formData.service_plans.length > 0) completedSteps.push(12);
      // Step 13 - Service Actions
      if (Array.isArray(formData.service_actions) && formData.service_actions.length > 0) completedSteps.push(13);
      // Step 14 - Documents
      if (Array.isArray(formData.documents) && formData.documents.length > 0) completedSteps.push(14);
      // Step 15 - Consent
      if (hasConsentInfo(formData.consent)) completedSteps.push(15);
      // Step 16 - Review (only mark complete after user explicitly confirms review)
      // Do NOT auto-mark as complete

      return completedSteps;
    } catch (error) {
      console.error('Error calculating completed steps:', error);
      return [];
    }
  };

  const handleStepClick = (stepNumber: number) => {
    try {
      console.log(`Navigating to step ${stepNumber}`);
      setCurrentStep(stepNumber);
      setStepError(null);
    } catch (error) {
      console.error('Error navigating to step:', error);
      setStepError(`Failed to navigate to step ${stepNumber}`);
    }
  };

  const handleNext = () => {
    try {
      // Find current position in filtered steps array
      const currentIndex = filteredSteps.findIndex(s => s.id === currentStep);
      if (currentIndex < filteredSteps.length - 1) {
        const nextStep = filteredSteps[currentIndex + 1];
        console.log(`Moving from step ${currentStep} (index ${currentIndex}) to step ${nextStep.id} (${nextStep.name})`);
        setCurrentStep(nextStep.id);
        setStepError(null);
      }
    } catch (error) {
      console.error('Error navigating to next step:', error);
      setStepError('Failed to proceed to next step');
    }
  };

  const handlePrevious = () => {
    try {
      // Find current position in filtered steps array
      const currentIndex = filteredSteps.findIndex(s => s.id === currentStep);
      if (currentIndex > 0) {
        const prevStep = filteredSteps[currentIndex - 1];
        console.log(`Moving from step ${currentStep} (index ${currentIndex}) to step ${prevStep.id} (${prevStep.name})`);
        setCurrentStep(prevStep.id);
        setStepError(null);
      }
    } catch (error) {
      console.error('Error navigating to previous step:', error);
      setStepError('Failed to go to previous step');
    }
  };

  const handleSaveDraft = async () => {
    // Block save if still checking for existing draft
    if (isCheckingExistingDraft) {
      toast.warning("Please wait, checking for existing draft...");
      return;
    }
    
    try {
      const formData = form.getValues();
      await saveDraft(formData, currentStep);
      setStepError(null);
    } catch (error) {
      console.error('Error saving draft:', error);
      setStepError('Failed to save draft');
    }
  };

  const handleFinalize = async () => {
    try {
      const formData = form.getValues();
      
      // First save as draft to get the latest data
      await saveDraft(formData, currentStep);
      
        // Set care plan status - always go directly to client approval (no staff approval step)
        const status = 'pending_client_approval';
      
      // Then finalize the care plan
      await createCarePlan({
        ...formData,
        client_id: clientId,
        status: status,
        care_plan_id: savedCarePlanId || carePlanId,
        // Clear change request fields if editing a change request
        ...(isEditingChangeRequest && {
          clear_change_request: true
        })
      });

      const successMessage = isEditingChangeRequest 
        ? "Care plan updated and sent back to client for approval!"
        : "Care plan sent to client for approval successfully!";
      
      toast.success(successMessage);
      onClose();
      setStepError(null);
    } catch (error) {
      console.error('Error finalizing care plan:', error);
      setStepError('Failed to finalize care plan');
      toast.error("Failed to finalize care plan. Please try again.");
    }
  };

  // Reset form state when dialog closes
  const handleClose = () => {
    setStepError(null);
    setCurrentStep(1);
    onClose();
  };

  const formData = form.watch();
  const completedSteps = getCompletedSteps();

  // Show loading state while client data is being fetched
  const isLoading = isClientLoading || isDraftLoading || !clientDataLoaded;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl h-[95vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b">
          <DialogTitle>
            {isEditingChangeRequest ? "Edit Care Plan - Addressing Client Changes" : 
             carePlanId ? "Edit Care Plan Draft" : "Create Care Plan"}
            {clientProfile && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                for {clientProfile.first_name} {clientProfile.last_name}
              </span>
            )}
          </DialogTitle>
          {isEditingChangeRequest && changeRequestData && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center mt-0.5">
                  <span className="text-amber-600 text-xs">!</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-800">Client Requested Changes</p>
                  <p className="text-sm text-amber-700 mt-1">{changeRequestData.comments}</p>
                  <p className="text-xs text-amber-600 mt-2">
                    Requested on {new Date(changeRequestData.requestedAt!).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogHeader>
        
        {stepError && (
          <div className="flex-shrink-0 px-6 py-2 bg-red-50 border-b border-red-200">
            <p className="text-red-700 text-sm">{stepError}</p>
            <button 
              onClick={() => setStepError(null)}
              className="text-red-600 hover:text-red-800 text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading client information...</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 min-h-0">
            {/* Sidebar - Hidden on mobile, visible on lg+ */}
            <div className="hidden lg:block flex-shrink-0">
        {clientProfile?.first_name && clientProfile?.last_name && (
          <div className="flex items-center gap-2 mb-4">
            <User className="h-4 w-4" />
            <span className="text-sm text-muted-foreground">
              {clientProfile.first_name} {clientProfile.last_name}
              {clientProfile.age_group && clientProfile.age_group !== 'adult' && (
                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  Young Person
                </span>
              )}
            </span>
          </div>
        )}
              <CarePlanWizardSidebar 
                steps={filteredSteps}
                currentStep={currentStep}
                completedSteps={completedSteps}
                onStepClick={handleStepClick}
                completionPercentage={draftData?.completion_percentage || 0}
              />
            </div>
            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-0 relative">
              <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4">
                <div className="max-w-4xl mx-auto space-y-6">
                  <Form {...form}>
                    <CarePlanWizardSteps 
                      currentStep={currentStep} 
                      form={form} 
                      clientId={clientId} 
                      effectiveCarePlanId={effectiveCarePlanId} 
                      filteredSteps={filteredSteps}
                      isChild={isChild}
                    />
                  </Form>
                </div>
              </div>

              {/* Footer - Fixed at bottom */}
              <div className="flex-shrink-0">
                <CarePlanWizardFooter
                  currentStep={currentStep}
                  totalSteps={totalSteps}
                  filteredSteps={filteredSteps}
                  onPrevious={handlePrevious}
                  onNext={handleNext}
                  onSaveDraft={handleSaveDraft}
                  onFinalize={handleFinalize}
                  isLoading={isSaving || isCreating}
                  isDraft={!!draftData}
                  formData={formData}
                />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
