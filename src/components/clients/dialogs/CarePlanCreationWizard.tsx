import React, { useState, useEffect, useRef } from "react";
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
import { fetchCarePlanStaffAssignments } from "@/hooks/useCarePlanStaffAssignments";
import { useMedicationsByCarePlan } from "@/hooks/useMedications";
import { toast } from "sonner";
import { 
  getCompletedStepIds, 
  calculateCompletionPercentage,
  isNonEmptyString,
  hasAnyValue,
  hasPersonalInfo,
  hasMedicalInfo,
  hasConsentInfo,
  hasRiskAssessments,
  CompletionContext
} from "@/utils/carePlanCompletionUtils";

const carePlanSchema = z.object({
  title: z.string().min(1, "Title is required"),
  provider_name: z.string().optional(),
  provider_type: z.string().optional(),
  staff_id: z.string().nullable().optional(),
  staff_ids: z.array(z.string()).optional().default([]),
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
  tasks: z.array(z.any()).optional(),
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
  { id: 15, name: "Tasks", description: "Care tasks for carer visits" },
  { id: 16, name: "Documents", description: "Supporting documents" },
  { id: 17, name: "Consent", description: "Consent and capacity assessment" },
  { id: 18, name: "Key Contacts", description: "Emergency and family contacts" },
  // Child-specific steps (only shown for children/young persons) - placed before Review
  { id: 19, name: "Behavior Support", description: "Challenging behaviors and crisis management", childOnly: true },
  { id: 20, name: "Education & Development", description: "Educational placement and development goals", childOnly: true },
  { id: 21, name: "Safeguarding & Risks", description: "Safeguarding assessments and risk plans", childOnly: true },
  // Review is now last
  { id: 22, name: "Review", description: "Review and finalize care plan" },
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
  const initialDraftLoadedRef = useRef(false);
  
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
  
  // Validate currentStep when filteredSteps changes (e.g., when client profile loads)
  // This ensures we don't stay on a child-only step for adult clients
  React.useEffect(() => {
    if (filteredSteps.length > 0 && currentStep > 0) {
      const stepExists = filteredSteps.some(s => s.id === currentStep);
      if (!stepExists) {
        console.log(`[CarePlanCreationWizard] Current step ${currentStep} not in filtered steps for this client type, resetting to step 1`);
        setCurrentStep(1);
      }
    }
  }, [filteredSteps, currentStep]);
  
  const form = useForm({
    resolver: zodResolver(carePlanSchema),
    defaultValues: {
      title: "",
      provider_name: "",
      provider_type: "staff",
      staff_id: null,
      staff_ids: [],
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
      tasks: [],
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
    saveUndoState,
    undoLastChange,
    canUndo,
    lastSaveTime,
  } = useCarePlanDraft(clientId, carePlanId, forceNew);

  // Effective care plan ID for database operations
  const effectiveCarePlanId = savedCarePlanId || carePlanId;

  // Fetch DB medications for the care plan to get accurate completion status
  const { data: dbMedications } = useMedicationsByCarePlan(effectiveCarePlanId || '');
  const medicationCount = dbMedications?.length ?? 0;

  const { createCarePlan, isCreating } = useCarePlanCreation();

  // Reset form state when dialog opens for a NEW care plan (no carePlanId)
  useEffect(() => {
    if (isOpen && !carePlanId) {
      console.log('Resetting form for new care plan - clientId:', clientId);
      setClientDataLoaded(false);
      setCurrentStep(1);
      setStepError(null);
      initialDraftLoadedRef.current = false;
      
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
        tasks: [],
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
  // Only set currentStep on INITIAL load to prevent auto-save from causing tab jumps
  useEffect(() => {
    if (draftData?.auto_save_data && !isDraftLoading && clientDataLoaded) {
      const savedData = draftData.auto_save_data;
      
      console.log('Loading draft data:', savedData, 'initialDraftLoaded:', initialDraftLoadedRef.current);
      
      try {
        // Safely set form values from saved data with proper type handling
        Object.keys(savedData).forEach((key) => {
          if (savedData[key] !== undefined) {
            let value = savedData[key];
            
            // Handle array fields with safety checks
            if (['risk_assessments', 'service_plans', 'service_actions', 'documents', 'goals', 'activities', 'staff_ids', 'tasks'].includes(key)) {
              value = initializeArrayField(value);
              
              // DEFENSIVE: Don't overwrite existing data with empty arrays
              const currentValue = form.getValues(key as any);
              if (Array.isArray(currentValue) && currentValue.length > 0 && value.length === 0) {
                console.warn(`[Draft Loading] Skipping empty ${key} - preserving existing data with ${currentValue.length} items`);
                return; // Skip this field
              }
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

        // Set current step from saved data ONLY on initial load (not on refetches from auto-save)
        if (draftData.last_step_completed && !initialDraftLoadedRef.current) {
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
          
          // Validate that the adjusted step exists in filteredSteps for current client type
          const stepExistsInFiltered = filteredSteps.some(s => s.id === adjustedStep);
          if (!stepExistsInFiltered) {
            // Reset to step 1 if saved step is not valid for current client type (e.g., child-only step for adult)
            console.log(`[CarePlanCreationWizard] Step ${adjustedStep} not valid for this client type, resetting to step 1`);
            adjustedStep = 1;
          }
          
          setCurrentStep(adjustedStep);
          initialDraftLoadedRef.current = true;
        }
        
        console.log('Draft data loaded successfully');
        setStepError(null);
      } catch (error) {
        console.error('Error loading draft data:', error);
      }
    }
  }, [draftData?.auto_save_data, isDraftLoading, clientDataLoaded, form, totalSteps]);

  // Load staff assignments from junction table when editing an existing care plan
  // PRIORITY: auto_save_data.staff_ids > junction table (draft may be more up-to-date)
  useEffect(() => {
    const loadStaffAssignments = async () => {
      const targetCarePlanId = savedCarePlanId || carePlanId;
      if (!targetCarePlanId) return;
      
      try {
        console.log('[CarePlanCreationWizard] Loading staff assignments for care plan:', targetCarePlanId);
        
        // Get staff_ids from auto_save_data (draft) - this is the source of truth for unsaved changes
        const autoSaveData = draftData?.auto_save_data as Record<string, unknown> | null;
        const draftStaffIds = (Array.isArray(autoSaveData?.staff_ids) ? autoSaveData.staff_ids : []) as string[];
        
        // Get staff_ids from junction table (finalized data)
        const assignments = await fetchCarePlanStaffAssignments(targetCarePlanId);
        const junctionStaffIds = assignments.map(a => a.staff_id);
        
        console.log('[CarePlanCreationWizard] Staff IDs comparison:', {
          draft: draftStaffIds,
          junction: junctionStaffIds,
          draftCount: draftStaffIds.length,
          junctionCount: junctionStaffIds.length
        });
        
        // Use whichever has MORE data - draft may be more up-to-date than junction
        // This fixes the bug where junction table sync overwrites correct draft data
        const staffIds = draftStaffIds.length >= junctionStaffIds.length 
          ? draftStaffIds 
          : junctionStaffIds;
        
        const currentStaffIds = form.getValues('staff_ids') || [];
        
        // Only update if we have staff and it's different from current
        if (staffIds.length > 0 && JSON.stringify(staffIds) !== JSON.stringify(currentStaffIds)) {
          console.log('[CarePlanCreationWizard] Setting staff_ids (using', 
            draftStaffIds.length >= junctionStaffIds.length ? 'draft' : 'junction', '):', staffIds);
          form.setValue('staff_ids', staffIds);
          form.setValue('staff_id', staffIds[0]); // Primary for backward compat
          
          // Also set provider_name from staff names if using junction data
          if (draftStaffIds.length < junctionStaffIds.length && assignments.length > 0) {
            const names = assignments
              .map(a => a.staff ? `${a.staff.first_name} ${a.staff.last_name}` : 'Unknown')
              .join(', ');
            if (names) {
              form.setValue('provider_name', names);
            }
          }
        }
      } catch (error) {
        console.error('[CarePlanCreationWizard] Error loading staff assignments:', error);
        setStepError('Failed to load saved data');
      }
    };
    
    loadStaffAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedCarePlanId, carePlanId, draftData?.auto_save_data, form]);

  // Auto-save on form changes - works for both new and existing care plans
  useEffect(() => {
    const subscription = form.watch((data) => {
      // Allow auto-save even for new care plans (without savedCarePlanId)
      // The useCarePlanDraft hook will handle creating a new draft if needed
      if (isOpen && clientDataLoaded && !isCheckingExistingDraft) {
        try {
          // Save undo state before auto-save
          saveUndoState(data);
          autoSave(data, currentStep, isChild, medicationCount);
        } catch (error) {
          console.error('Auto-save error:', error);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, autoSave, currentStep, isOpen, clientDataLoaded, isCheckingExistingDraft, saveUndoState, isChild, medicationCount]);

  // Handle undo action
  const handleUndo = () => {
    const previousState = undoLastChange();
    if (previousState) {
      form.reset(previousState);
      toast.success("Changes undone");
    } else {
      toast.info("Nothing to undo");
    }
  };

  // Calculate completed steps based on form data using unified utility
  // Now includes DB medication count for accurate completion status
  const getCompletedSteps = () => {
    try {
      const formData = form.getValues();
      const ctx: CompletionContext = { medicationCount };
      return getCompletedStepIds(formData, isChild, ctx);
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
      await saveDraft(formData, currentStep, isChild, medicationCount);
      setStepError(null);
    } catch (error) {
      console.error('Error saving draft:', error);
      setStepError('Failed to save draft');
    }
  };

  const handleFinalize = async () => {
    try {
      const formData = form.getValues();
      
      // Explicitly get staff_ids to ensure multi-staff selection is passed
      const staffIds = formData.staff_ids || [];
      const staffId = formData.staff_id || (staffIds.length > 0 ? staffIds[0] : null);
      
      console.log('[handleFinalize] Staff data:', { staff_id: staffId, staff_ids: staffIds });
      
      // First save as draft to get the latest data
      await saveDraft(formData, currentStep, isChild, medicationCount);
      
      // Set care plan status - always go directly to client approval (no staff approval step)
      const status = 'pending_client_approval';
      
      // Then finalize the care plan with explicit staff_ids
      await createCarePlan({
        ...formData,
        client_id: clientId,
        status: status,
        care_plan_id: savedCarePlanId || carePlanId,
        staff_id: staffId,
        staff_ids: staffIds,
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

  // Reset form state when dialog closes - save draft first to prevent data loss
  const handleClose = async () => {
    try {
      // Save current form state before closing to prevent data loss
      const formData = form.getValues();
      
      if (clientId && formData) {
        console.log('[handleClose] Saving draft before closing...');
        await saveDraft(formData, currentStep, isChild, medicationCount);
        console.log('[handleClose] Draft saved successfully');
      }
    } catch (error) {
      console.error('[handleClose] Error saving draft on close:', error);
      // Continue closing even if save fails - don't block the user
    } finally {
      setStepError(null);
      setCurrentStep(1);
      initialDraftLoadedRef.current = false;
      onClose();
    }
  };

  const formData = form.watch();
  const completedSteps = getCompletedSteps();
  
  // Calculate real-time completion percentage using the unified utility
  // This ensures the wizard shows the same % as the list view
  const completionPercentage = React.useMemo(() => {
    try {
      const formData = form.getValues();
      const ctx: CompletionContext = { medicationCount };
      return calculateCompletionPercentage(formData, isChild, ctx);
    } catch (error) {
      console.error('Error calculating completion percentage:', error);
      return 0;
    }
  }, [completedSteps, medicationCount, isChild, form]);

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
            <div className="hidden lg:block flex-shrink-0 h-full overflow-hidden">
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
                completionPercentage={completionPercentage}
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
                  onUndo={handleUndo}
                  canUndo={canUndo}
                  lastSaveTime={lastSaveTime}
                />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
