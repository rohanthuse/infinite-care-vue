
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
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
  hobbies: z.object({
    selected_hobbies: z.array(z.string()).optional().default([]),
  }).optional(),
  medical_info: z.any().optional(),
  goals: z.array(z.any()).optional(),
  activities: z.array(z.any()).optional(),
  personal_care: z.any().optional(),
  dietary: z.object({
    // Allergies section
    food_allergies: z.array(z.string()).optional().default([]),
    
    // Malnutrition & Dehydration section
    at_risk_malnutrition: z.boolean().optional().default(false),
    malnutrition_items: z.array(z.string()).optional().default([]),
    at_risk_dehydration: z.boolean().optional().default(false),
    dehydration_items: z.array(z.string()).optional().default([]),
    check_fridge_expiry: z.boolean().optional().default(false),
    fridge_expiry_items: z.array(z.string()).optional().default([]),
    
    // Cooking & Meal Preparation section
    do_you_cook: z.boolean().optional().default(false),
    cooking_items: z.array(z.string()).optional().default([]),
    help_with_cooking: z.boolean().optional().default(false),
    preparation_instructions: z.string().optional().default(""),
    
    // Extra Information section
    avoid_medical_reasons: z.boolean().optional().default(false),
    medical_avoidance_items: z.array(z.string()).optional().default([]),
    avoid_religious_reasons: z.boolean().optional().default(false),
    religious_avoidance_items: z.array(z.string()).optional().default([]),
    
    // Legacy fields - kept for backward compatibility
    has_allergies: z.enum(["yes", "no"]).optional(),
    needs_cooking_help: z.enum(["yes", "no"]).optional(),
    religious_cultural_requirements: z.enum(["yes", "no"]).optional(),
    swallowing_concerns: z.enum(["yes", "no"]).optional(),
    needs_help_cutting_food: z.enum(["yes", "no"]).optional(),
    meal_schedule_requirements: z.enum(["yes", "no"]).optional(),
    hydration_support: z.enum(["yes", "no"]).optional(),
    food_prep_instructions: z.string().optional(),
    religious_cultural_details: z.string().optional(),
    swallowing_details: z.string().optional(),
    cutting_food_details: z.string().optional(),
    meal_schedule_details: z.string().optional(),
    hydration_details: z.string().optional(),
    dietary_restrictions: z.array(z.string()).optional().default([]),
    food_preferences: z.array(z.string()).optional().default([]),
    supplements: z.array(z.string()).optional().default([]),
    nutritional_needs: z.string().optional().default(""),
    meal_schedule: z.any().optional(),
    feeding_assistance_required: z.boolean().optional().default(false),
    special_equipment_needed: z.string().optional().default(""),
    texture_modifications: z.string().optional().default(""),
    fluid_restrictions: z.string().optional().default(""),
    weight_monitoring: z.boolean().optional().default(false),
  }).optional(),
  risk_assessments: z.array(z.any()).optional(),
  risk_equipment_dietary: z.object({
    equipment_required: z.boolean().optional().default(false),
    equipment_breakdown_impact: z.string().optional().default(""),
    equipment_backup_plan: z.string().optional().default(""),
    dietary_restrictions_risk: z.boolean().optional().default(false),
    dietary_emergency_plan: z.string().optional().default(""),
    special_dietary_equipment: z.string().optional().default(""),
  }).optional(),
  risk_medication: z.object({
    medication_errors_risk: z.boolean().optional().default(false),
    medication_compliance_risk: z.boolean().optional().default(false),
    medication_storage_risk: z.boolean().optional().default(false),
    medication_side_effects_risk: z.boolean().optional().default(false),
    medication_interaction_risk: z.boolean().optional().default(false),
    medication_emergency_contact: z.string().optional().default(""),
    medication_contingency_plan: z.string().optional().default(""),
  }).optional(),
  risk_dietary_food: z.object({
    food_allergies_risk: z.boolean().optional().default(false),
    choking_risk: z.boolean().optional().default(false),
    nutritional_deficiency_risk: z.boolean().optional().default(false),
    food_poisoning_risk: z.boolean().optional().default(false),
    eating_disorder_risk: z.boolean().optional().default(false),
    food_preparation_safety: z.string().optional().default(""),
    emergency_nutrition_plan: z.string().optional().default(""),
  }).optional(),
  risk_warning_instructions: z.object({
    warning_notes: z.string().optional().default(""),
    special_instructions: z.string().optional().default(""),
    emergency_contacts: z.string().optional().default(""),
    important_information: z.string().optional().default(""),
  }).optional(),
  risk_choking: z.object({
    choking_risk: z.boolean().optional().default(false),
    risk_level: z.string().optional().default(""),
    risk_factors: z.array(z.string()).optional().default([]),
    mitigation_plan: z.string().optional().default(""),
    emergency_procedure: z.string().optional().default(""),
  }).optional(),
  risk_pressure_damage: z.object({
    pressure_damage_risk: z.boolean().optional().default(false),
    risk_level: z.string().optional().default(""),
    risk_areas: z.array(z.string()).optional().default([]),
    prevention_plan: z.string().optional().default(""),
    monitoring_schedule: z.string().optional().default(""),
    equipment_needed: z.string().optional().default(""),
  }).optional(),
  equipment: z.object({
    equipment_blocks: z.array(z.any()).optional(),
    moving_handling: z.object({
      how_to_transfer_client: z.string().optional(),
      area_preparation_needed: z.string().optional(),
      type_of_equipment_required: z.string().optional(),
    }).optional(),
    environment_checks: z.object({
      adequate_lighting: z.enum(["yes", "no"]).optional(),
      space_constraints: z.enum(["yes", "no"]).optional(),
      trip_hazards: z.enum(["yes", "no"]).optional(),
      variation_in_levels: z.enum(["yes", "no"]).optional(),
      narrow_passages: z.enum(["yes", "no"]).optional(),
      heavy_doors: z.enum(["yes", "no"]).optional(),
      floor_surfaces: z.enum(["yes", "no"]).optional(),
      pets_present: z.enum(["yes", "no"]).optional(),
      other_people_present: z.enum(["yes", "no"]).optional(),
      temperature_considerations: z.enum(["yes", "no"]).optional(),
      other_considerations: z.enum(["yes", "no"]).optional(),
    }).optional(),
    home_repairs: z.object({
      repair_needed: z.string().optional(),
      repair_other: z.string().optional(),
      contact_name: z.string().optional(),
      contact_telephone: z.string().optional(),
    }).optional(),
  }).optional(),
  service_plans: z.array(z.any()).optional(),
  service_actions: z.array(z.any()).optional(),
  documents: z.array(z.any()).optional(),
  consent: z.object({
    // Having Capacity tab - consent questions
    discuss_health_and_risks: z.enum(["yes", "no"]).optional(),
    medication_support_consent: z.enum(["yes", "no"]).optional(),
    care_plan_importance_understood: z.enum(["yes", "no"]).optional(),
    share_info_with_professionals: z.enum(["yes", "no"]).optional(),
    regular_reviews_understood: z.enum(["yes", "no"]).optional(),
    may_need_capacity_assessment: z.enum(["yes", "no"]).optional(),
    
    // Having Capacity tab - existing fields
    has_capacity: z.boolean().optional().default(false),
    capacity_assessment_date: z.string().optional().default(""),
    capacity_notes: z.string().optional().default(""),
    
    // Lacking Capacity tab
    lacks_capacity: z.boolean().optional().default(false),
    capacity_loss_reason: z.string().optional().default(""),
    best_interest_decision: z.boolean().optional().default(false),
    best_interest_date: z.string().optional().default(""),
    best_interest_notes: z.string().optional().default(""),
    
    // Third Party Consent tab
    third_party_consent: z.boolean().optional().default(false),
    third_party_name: z.string().optional().default(""),
    third_party_relationship: z.string().optional().default(""),
    third_party_contact: z.string().optional().default(""),
    third_party_consent_date: z.string().optional().default(""),
    third_party_notes: z.string().optional().default(""),
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
  { id: 1, name: "Basic Information", description: "Care plan title and basic details" },
  { id: 2, name: "Personal Information", description: "Client personal details" },
  { id: 3, name: "About Me", description: "Client preferences and background" },
  { id: 4, name: "General", description: "General preferences and safety notes" },
  { id: 5, name: "Hobbies", description: "Client hobbies and interests" },
  { id: 6, name: "Medical and Mental", description: "Health conditions and medications" },
  { id: 7, name: "Admin Medication", description: "Medication administration details" },
  { id: 8, name: "Goals", description: "Care goals and objectives" },
  { id: 9, name: "Activities", description: "Daily activities and routines" },
  { id: 10, name: "Personal Care", description: "Personal care requirements" },
  { id: 11, name: "Dietary", description: "Dietary needs and restrictions" },
  { id: 12, name: "Risk Assessments", description: "Safety and risk evaluations" },
  { id: 13, name: "Equipment", description: "Required equipment and aids" },
  { id: 14, name: "Service Plans", description: "Service delivery plans" },
  { id: 15, name: "Service Actions", description: "Specific service actions" },
  { id: 16, name: "Documents", description: "Supporting documents" },
  { id: 17, name: "Consent", description: "Consent and capacity assessment" },
  { id: 18, name: "Review", description: "Review and finalize care plan" },
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
  const totalSteps = 18;
  
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
      hobbies: {},
      medical_info: {},
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

  const { 
    draftData, 
    isDraftLoading, 
    saveDraft, 
    autoSave, 
    isSaving,
    savedCarePlanId,
  } = useCarePlanDraft(clientId, carePlanId);

  const { createCarePlan, isCreating } = useCarePlanCreation();

  // Fetch client profile data
  const { data: clientProfile, isLoading: isClientLoading } = useClientProfile(clientId);

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
            else if (['personal_info', 'about_me', 'general', 'hobbies', 'medical_info', 'personal_care', 'dietary', 'risk_equipment_dietary', 'risk_medication', 'risk_dietary_food', 'risk_warning_instructions', 'risk_choking', 'risk_pressure_damage', 'consent'].includes(key)) {
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
          
          // If draft was saved before Hobbies step was added (step 5), adjust step numbers
          if (savedData && typeof savedData === 'object' && !Array.isArray(savedData) && !savedData.hobbies && adjustedStep >= 5) {
            adjustedStep += 1; // Shift forward to account for new Hobbies step at position 5
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

  // Calculate completed steps based on form data
  const getCompletedSteps = () => {
    try {
      const formData = form.getValues();
      const completedSteps: number[] = [];

      // Check each step for completion with safety checks
      if (formData.title?.trim()) completedSteps.push(1);
      if (formData.personal_info && Object.keys(formData.personal_info).length > 0) completedSteps.push(2);
      if (formData.about_me && Object.keys(formData.about_me).length > 0) completedSteps.push(3);
      if (formData.general && Object.keys(formData.general).length > 0) completedSteps.push(4);
      if (formData.hobbies && Object.keys(formData.hobbies).length > 0) completedSteps.push(5);
      if (formData.medical_info && Object.keys(formData.medical_info).length > 0) completedSteps.push(6);
      if (formData.medical_info && typeof formData.medical_info === 'object' && 'admin_medication' in formData.medical_info && formData.medical_info.admin_medication && Object.keys(formData.medical_info.admin_medication).length > 0) completedSteps.push(7);
      if (Array.isArray(formData.goals) && formData.goals.length > 0) completedSteps.push(8);
      if (Array.isArray(formData.activities) && formData.activities.length > 0) completedSteps.push(9);
      if (formData.personal_care && Object.keys(formData.personal_care).length > 0) completedSteps.push(10);
      if (formData.dietary && Object.keys(formData.dietary).length > 0) completedSteps.push(11);
      if ((Array.isArray(formData.risk_assessments) && formData.risk_assessments.length > 0) ||
          (formData.risk_equipment_dietary && Object.keys(formData.risk_equipment_dietary).length > 0) ||
          (formData.risk_medication && Object.keys(formData.risk_medication).length > 0) ||
          (formData.risk_dietary_food && Object.keys(formData.risk_dietary_food).length > 0) ||
          (formData.risk_warning_instructions && Object.keys(formData.risk_warning_instructions).length > 0) ||
          (formData.risk_choking && Object.keys(formData.risk_choking).length > 0) ||
          (formData.risk_pressure_damage && Object.keys(formData.risk_pressure_damage).length > 0)) completedSteps.push(12);
      if (formData.equipment && typeof formData.equipment === 'object' && (
        (Array.isArray(formData.equipment.equipment_blocks) && formData.equipment.equipment_blocks.length > 0) ||
        (formData.equipment.moving_handling && Object.keys(formData.equipment.moving_handling).length > 0) ||
        (formData.equipment.environment_checks && Object.keys(formData.equipment.environment_checks).length > 0) ||
        (formData.equipment.home_repairs && Object.keys(formData.equipment.home_repairs).length > 0)
      )) completedSteps.push(13);
      if (Array.isArray(formData.service_plans) && formData.service_plans.length > 0) completedSteps.push(14);
      if (Array.isArray(formData.service_actions) && formData.service_actions.length > 0) completedSteps.push(15);
      if (Array.isArray(formData.documents) && formData.documents.length > 0) completedSteps.push(16);
      if (formData.consent && Object.keys(formData.consent).length > 0) completedSteps.push(17);
      
      // Step 18 (Review) is considered completed when ready to finalize
      if (completedSteps.length >= 4) completedSteps.push(18);

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
      if (currentStep < totalSteps) {
        console.log(`Moving from step ${currentStep} to ${currentStep + 1}`);
        setCurrentStep(currentStep + 1);
        setStepError(null);
      }
    } catch (error) {
      console.error('Error navigating to next step:', error);
      setStepError('Failed to proceed to next step');
    }
  };

  const handlePrevious = () => {
    try {
      if (currentStep > 1) {
        console.log(`Moving from step ${currentStep} to ${currentStep - 1}`);
        setCurrentStep(currentStep - 1);
        setStepError(null);
      }
    } catch (error) {
      console.error('Error navigating to previous step:', error);
      setStepError('Failed to go to previous step');
    }
  };

  const handleSaveDraft = async () => {
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
      
      // Determine the appropriate status based on whether this is editing a change request
      const status = isEditingChangeRequest ? 'pending_client_approval' : 'pending_approval';
      
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
        : "Care plan sent for staff approval successfully!";
      
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
              <CarePlanWizardSidebar
                steps={wizardSteps}
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
                    />
                  </Form>
                </div>
              </div>

              {/* Footer - Fixed at bottom */}
              <div className="flex-shrink-0">
                <CarePlanWizardFooter
                  currentStep={currentStep}
                  totalSteps={totalSteps}
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
