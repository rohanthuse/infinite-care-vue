import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CarePlanWizardSidebar } from "./wizard/CarePlanWizardSidebar";
import { CarePlanWizardSteps } from "./wizard/CarePlanWizardSteps";
import { CarePlanWizardFooter } from "./wizard/CarePlanWizardFooter";

// Comprehensive schema for all care plan data
const carePlanSchema = z.object({
  // Step 1: Basic Information
  title: z.string().min(3, "Title must be at least 3 characters"),
  provider_type: z.enum(["staff", "external"]),
  staff_id: z.string().optional(),
  provider_name: z.string().optional(),
  start_date: z.date(),
  end_date: z.date().optional(),
  review_date: z.date().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  care_plan_type: z.string().default("standard"),
  
  // Step 2: Personal Information
  personal_info: z.object({
    emergency_contact_name: z.string().optional(),
    emergency_contact_phone: z.string().optional(),
    emergency_contact_relationship: z.string().optional(),
    next_of_kin_name: z.string().optional(),
    next_of_kin_phone: z.string().optional(),
    next_of_kin_relationship: z.string().optional(),
    gp_name: z.string().optional(),
    gp_practice: z.string().optional(),
    gp_phone: z.string().optional(),
    preferred_communication: z.string().optional(),
    language_preferences: z.string().optional(),
    cultural_preferences: z.string().optional(),
    religion: z.string().optional(),
    marital_status: z.string().optional(),
  }).optional(),

  // Step 3: About Me
  about_me: z.object({
    life_history: z.string().optional(),
    interests_hobbies: z.array(z.string()).optional(),
    personality_traits: z.string().optional(),
    communication_style: z.string().optional(),
    important_people: z.string().optional(),
    meaningful_activities: z.string().optional(),
  }).optional(),

  // Step 4: Medical Information
  medical_info: z.object({
    medical_conditions: z.array(z.string()).optional(),
    current_medications: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
    medical_history: z.string().optional(),
    mobility_status: z.string().optional(),
    cognitive_status: z.string().optional(),
    communication_needs: z.string().optional(),
    sensory_impairments: z.array(z.string()).optional(),
    mental_health_status: z.string().optional(),
  }).optional(),

  // Step 5: Goals
  goals: z.array(z.object({
    description: z.string(),
    target_date: z.date().optional(),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
    measurable_outcome: z.string().optional(),
  })).optional(),

  // Step 6: Activities
  activities: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    frequency: z.string(),
    duration: z.string().optional(),
    time_of_day: z.string().optional(),
  })).optional(),

  // Step 7: Personal Care
  personal_care: z.object({
    bathing_preferences: z.string().optional(),
    dressing_assistance_level: z.string().optional(),
    toileting_assistance_level: z.string().optional(),
    continence_status: z.string().optional(),
    sleep_patterns: z.string().optional(),
    personal_hygiene_needs: z.string().optional(),
    skin_care_needs: z.string().optional(),
    pain_management: z.string().optional(),
    comfort_measures: z.string().optional(),
    behavioral_notes: z.string().optional(),
  }).optional(),

  // Step 8: Dietary Requirements
  dietary: z.object({
    dietary_restrictions: z.array(z.string()).optional(),
    food_allergies: z.array(z.string()).optional(),
    food_preferences: z.array(z.string()).optional(),
    texture_modifications: z.string().optional(),
    fluid_restrictions: z.string().optional(),
    nutritional_needs: z.string().optional(),
    supplements: z.array(z.string()).optional(),
    feeding_assistance_required: z.boolean().optional(),
    weight_monitoring: z.boolean().optional(),
    special_equipment_needed: z.string().optional(),
    meal_schedule: z.record(z.string()).optional(),
  }).optional(),

  // Step 9: Risk Assessments
  risk_assessments: z.array(z.object({
    risk_type: z.string(),
    risk_level: z.enum(["low", "medium", "high"]),
    risk_factors: z.array(z.string()).optional(),
    mitigation_strategies: z.array(z.string()).optional(),
    review_date: z.date().optional(),
    assessed_by: z.string(),
  })).optional(),

  // Step 10: Equipment
  equipment: z.array(z.object({
    equipment_name: z.string(),
    equipment_type: z.string(),
    manufacturer: z.string().optional(),
    model_number: z.string().optional(),
    serial_number: z.string().optional(),
    installation_date: z.date().optional(),
    last_maintenance_date: z.date().optional(),
    next_maintenance_date: z.date().optional(),
    maintenance_schedule: z.string().optional(),
    location: z.string().optional(),
    notes: z.string().optional(),
  })).optional(),

  // Step 11: Service Plans
  service_plans: z.array(z.object({
    service_name: z.string(),
    service_category: z.string(),
    provider_name: z.string(),
    start_date: z.date(),
    end_date: z.date().optional(),
    frequency: z.string(),
    duration: z.string(),
    goals: z.array(z.string()).optional(),
    notes: z.string().optional(),
  })).optional(),

  // Step 12: Service Actions
  service_actions: z.array(z.object({
    service_name: z.string(),
    service_category: z.string(),
    provider_name: z.string(),
    start_date: z.date(),
    end_date: z.date().optional(),
    frequency: z.string(),
    duration: z.string(),
    schedule_details: z.string().optional(),
    goals: z.array(z.string()).optional(),
    notes: z.string().optional(),
  })).optional(),

  // Step 13: Documents
  documents: z.array(z.object({
    name: z.string(),
    type: z.string(),
    upload_date: z.date(),
    uploaded_by: z.string(),
    file_path: z.string().optional(),
    file_size: z.string().optional(),
  })).optional(),

  // Step 14: Review & Notes
  notes: z.string().optional(),
  additional_notes: z.string().optional(),
});

type CarePlanFormData = z.infer<typeof carePlanSchema>;

const WIZARD_STEPS = [
  { id: 1, name: "Basic Information", description: "Title, provider, and dates" },
  { id: 2, name: "Personal Information", description: "Contact details and demographics" },
  { id: 3, name: "About Me", description: "Personal preferences and life history" },
  { id: 4, name: "Medical Information", description: "Health conditions and medications" },
  { id: 5, name: "Goals", description: "Care objectives and outcomes" },
  { id: 6, name: "Activities", description: "Scheduled tasks and care activities" },
  { id: 7, name: "Personal Care", description: "Daily living assistance needs" },
  { id: 8, name: "Dietary Requirements", description: "Nutrition and feeding needs" },
  { id: 9, name: "Risk Assessments", description: "Safety risks and mitigation" },
  { id: 10, name: "Equipment", description: "Assistive devices and maintenance" },
  { id: 11, name: "Service Plans", description: "Overall care coordination" },
  { id: 12, name: "Service Actions", description: "Specific interventions" },
  { id: 13, name: "Documents", description: "File uploads and organization" },
  { id: 14, name: "Review & Finalize", description: "Summary and completion" },
];

// Helper function to recursively serialize dates in any object
const serializeForJSON = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeForJSON);
  }
  
  if (typeof obj === 'object') {
    const serialized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeForJSON(value);
    }
    return serialized;
  }
  
  return obj;
};

// Helper function to deserialize dates from JSON
const deserializeFromJSON = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(deserializeFromJSON);
  }
  
  if (typeof obj === 'object') {
    const deserialized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && key.includes('date') && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        deserialized[key] = new Date(value);
      } else {
        deserialized[key] = deserializeFromJSON(value);
      }
    }
    return deserialized;
  }
  
  return obj;
};

interface CarePlanCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onComplete: () => void;
  draftCarePlanId?: string;
}

export function CarePlanCreationWizard({
  open,
  onOpenChange,
  clientId,
  onComplete,
  draftCarePlanId
}: CarePlanCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [carePlanId, setCarePlanId] = useState<string | null>(draftCarePlanId || null);
  const [isDraft, setIsDraft] = useState(false);
  const { toast } = useToast();
  const { id: branchId } = useParams();
  const queryClient = useQueryClient();

  const form = useForm<CarePlanFormData>({
    resolver: zodResolver(carePlanSchema),
    defaultValues: {
      title: "",
      provider_type: "staff",
      staff_id: "",
      provider_name: "",
      start_date: new Date(),
      priority: "medium",
      care_plan_type: "standard",
      personal_info: {},
      about_me: {},
      medical_info: {},
      goals: [],
      activities: [],
      personal_care: {},
      dietary: {},
      risk_assessments: [],
      equipment: [],
      service_plans: [],
      service_actions: [],
      documents: [],
      notes: "",
    },
  });

  // Auto-save functionality
  useEffect(() => {
    if (!carePlanId || !open) return;

    const autoSaveInterval = setInterval(async () => {
      const formData = form.getValues();
      try {
        // Serialize form data for JSON storage with proper date handling
        const serializedFormData = serializeForJSON(formData);

        await supabase
          .from('client_care_plans')
          .update({
            auto_save_data: serializedFormData,
            last_step_completed: currentStep,
            updated_at: new Date().toISOString(),
          })
          .eq('id', carePlanId);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 180000); // Auto-save every 3 minutes

    return () => clearInterval(autoSaveInterval);
  }, [carePlanId, currentStep, form, open]);

  // Load draft data if editing existing draft
  useEffect(() => {
    if (draftCarePlanId && open) {
      loadDraftData(draftCarePlanId);
    }
  }, [draftCarePlanId, open]);

  const loadDraftData = async (draftId: string) => {
    try {
      const { data, error } = await supabase
        .from('client_care_plans')
        .select('*, care_plan_wizard_steps(*)')
        .eq('id', draftId)
        .single();

      if (error) throw error;

      if (data.auto_save_data) {
        const autoSaveData = data.auto_save_data as any;
        // Deserialize dates properly
        const deserializedData = deserializeFromJSON(autoSaveData);
        form.reset(deserializedData as CarePlanFormData);
      }

      setCurrentStep(data.last_step_completed || 1);
      
      const completedStepNumbers = data.care_plan_wizard_steps
        ?.filter((step: any) => step.is_completed)
        .map((step: any) => step.step_number) || [];
      
      setCompletedSteps(completedStepNumbers);
      setCarePlanId(draftId);
      setIsDraft(data.status === 'draft');
    } catch (error) {
      console.error('Error loading draft:', error);
      toast({
        title: "Error",
        description: "Failed to load draft care plan",
        variant: "destructive",
      });
    }
  };

  const createOrUpdateCarePlan = useMutation({
    mutationFn: async (data: { formData: CarePlanFormData; saveAsDraft: boolean }) => {
      const { formData, saveAsDraft } = data;

      // Serialize form data for JSON storage with proper date handling
      const serializedFormData = serializeForJSON(formData);

      let carePlan;
      if (carePlanId) {
        // Update existing care plan
        const { data: updated, error } = await supabase
          .from('client_care_plans')
          .update({
            title: formData.title,
            provider_name: formData.provider_name,
            staff_id: formData.staff_id,
            start_date: formData.start_date.toISOString().split('T')[0],
            end_date: formData.end_date ? formData.end_date.toISOString().split('T')[0] : null,
            review_date: formData.review_date ? formData.review_date.toISOString().split('T')[0] : null,
            status: saveAsDraft ? 'draft' : 'active',
            priority: formData.priority,
            care_plan_type: formData.care_plan_type,
            notes: formData.notes,
            auto_save_data: serializedFormData,
            last_step_completed: currentStep,
            completion_percentage: calculateCompletionPercentage(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', carePlanId)
          .select()
          .single();

        if (error) throw error;
        carePlan = updated;
      } else {
        // Create new care plan
        const { data: created, error } = await supabase
          .from('client_care_plans')
          .insert({
            client_id: clientId,
            title: formData.title,
            provider_name: formData.provider_name,
            staff_id: formData.staff_id,
            start_date: formData.start_date.toISOString().split('T')[0],
            end_date: formData.end_date ? formData.end_date.toISOString().split('T')[0] : null,
            review_date: formData.review_date ? formData.review_date.toISOString().split('T')[0] : null,
            status: saveAsDraft ? 'draft' : 'active',
            priority: formData.priority,
            care_plan_type: formData.care_plan_type,
            notes: formData.notes,
            auto_save_data: serializedFormData,
            last_step_completed: currentStep,
            completion_percentage: calculateCompletionPercentage(),
          })
          .select()
          .single();

        if (error) throw error;
        carePlan = created;
        setCarePlanId(carePlan.id);
      }

      // Save related data based on form data
      await saveRelatedData(carePlan.id, formData);

      return carePlan;
    },
    onSuccess: (carePlan, { saveAsDraft }) => {
      queryClient.invalidateQueries({ queryKey: ['care-plans'] });
      queryClient.invalidateQueries({ queryKey: ['client-care-plans', clientId] });
      
      toast({
        title: saveAsDraft ? "Draft saved" : "Care plan created",
        description: saveAsDraft 
          ? "Your care plan has been saved as a draft" 
          : "The care plan has been created successfully",
      });

      if (!saveAsDraft) {
        onComplete();
        onOpenChange(false);
      }
    },
    onError: (error) => {
      console.error('Error saving care plan:', error);
      toast({
        title: "Error",
        description: "Failed to save care plan. Please try again.",
        variant: "destructive",
      });
    }
  });

  const saveRelatedData = async (carePlanId: string, formData: CarePlanFormData) => {
    // Save personal information
    if (formData.personal_info && Object.keys(formData.personal_info).length > 0) {
      await supabase
        .from('client_personal_info')
        .upsert({
          client_id: clientId,
          ...formData.personal_info,
        }, { onConflict: 'client_id' });
    }

    // Save medical information
    if (formData.medical_info && Object.keys(formData.medical_info).length > 0) {
      await supabase
        .from('client_medical_info')
        .upsert({
          client_id: clientId,
          ...formData.medical_info,
        }, { onConflict: 'client_id' });
    }

    // Save personal care
    if (formData.personal_care && Object.keys(formData.personal_care).length > 0) {
      await supabase
        .from('client_personal_care')
        .upsert({
          client_id: clientId,
          ...formData.personal_care,
        }, { onConflict: 'client_id' });
    }

    // Save dietary requirements
    if (formData.dietary && Object.keys(formData.dietary).length > 0) {
      await supabase
        .from('client_dietary_requirements')
        .upsert({
          client_id: clientId,
          ...formData.dietary,
        }, { onConflict: 'client_id' });
    }

    // Save goals
    if (formData.goals && formData.goals.length > 0) {
      for (const goal of formData.goals) {
        await supabase
          .from('client_care_plan_goals')
          .insert({
            care_plan_id: carePlanId,
            description: goal.description,
            status: 'not-started',
          });
      }
    }

    // Save activities
    if (formData.activities && formData.activities.length > 0) {
      for (const activity of formData.activities) {
        await supabase
          .from('client_activities')
          .insert({
            care_plan_id: carePlanId,
            name: activity.name,
            description: activity.description,
            frequency: activity.frequency,
            status: 'active',
          });
      }
    }

    // Save risk assessments
    if (formData.risk_assessments && formData.risk_assessments.length > 0) {
      for (const risk of formData.risk_assessments) {
        await supabase
          .from('client_risk_assessments')
          .insert({
            client_id: clientId,
            risk_type: risk.risk_type,
            risk_level: risk.risk_level,
            risk_factors: risk.risk_factors,
            mitigation_strategies: risk.mitigation_strategies,
            assessment_date: new Date().toISOString().split('T')[0],
            assessed_by: risk.assessed_by,
            review_date: risk.review_date ? risk.review_date.toISOString().split('T')[0] : null,
          });
      }
    }

    // Save equipment
    if (formData.equipment && formData.equipment.length > 0) {
      for (const equip of formData.equipment) {
        await supabase
          .from('client_equipment')
          .insert({
            client_id: clientId,
            equipment_name: equip.equipment_name,
            equipment_type: equip.equipment_type,
            manufacturer: equip.manufacturer,
            model_number: equip.model_number,
            serial_number: equip.serial_number,
            installation_date: equip.installation_date ? equip.installation_date.toISOString().split('T')[0] : null,
            last_maintenance_date: equip.last_maintenance_date ? equip.last_maintenance_date.toISOString().split('T')[0] : null,
            next_maintenance_date: equip.next_maintenance_date ? equip.next_maintenance_date.toISOString().split('T')[0] : null,
            maintenance_schedule: equip.maintenance_schedule,
            location: equip.location,
            notes: equip.notes,
          });
      }
    }

    // Save service actions
    if (formData.service_actions && formData.service_actions.length > 0) {
      for (const action of formData.service_actions) {
        await supabase
          .from('client_service_actions')
          .insert({
            client_id: clientId,
            care_plan_id: carePlanId,
            service_name: action.service_name,
            service_category: action.service_category,
            provider_name: action.provider_name,
            start_date: action.start_date.toISOString().split('T')[0],
            end_date: action.end_date ? action.end_date.toISOString().split('T')[0] : null,
            frequency: action.frequency,
            duration: action.duration,
            schedule_details: action.schedule_details,
            goals: action.goals,
            notes: action.notes,
          });
      }
    }
  };

  const calculateCompletionPercentage = () => {
    return Math.round((completedSteps.length / WIZARD_STEPS.length) * 100);
  };

  const markStepCompleted = async (stepNumber: number) => {
    if (!carePlanId) return;

    try {
      const formData = form.getValues();
      // Serialize form data for JSON storage with proper date handling
      const serializedStepData = serializeForJSON(formData);

      await supabase
        .from('care_plan_wizard_steps')
        .upsert({
          care_plan_id: carePlanId,
          step_number: stepNumber,
          step_name: WIZARD_STEPS[stepNumber - 1].name,
          is_completed: true,
          completed_at: new Date().toISOString(),
          step_data: serializedStepData,
        }, { onConflict: 'care_plan_id,step_number' });

      setCompletedSteps(prev => [...new Set([...prev, stepNumber])]);
    } catch (error) {
      console.error('Error marking step completed:', error);
    }
  };

  const handleNextStep = () => {
    markStepCompleted(currentStep);
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDraft = () => {
    const formData = form.getValues();
    createOrUpdateCarePlan.mutate({ formData, saveAsDraft: true });
    setIsDraft(true);
  };

  const handleFinalize = () => {
    const formData = form.getValues();
    createOrUpdateCarePlan.mutate({ formData, saveAsDraft: false });
  };

  const handleStepClick = (stepNumber: number) => {
    setCurrentStep(stepNumber);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl font-semibold text-blue-600">
            {draftCarePlanId ? "Edit Care Plan" : "Create Care Plan"} - Step {currentStep} of {WIZARD_STEPS.length}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex h-full">
          <CarePlanWizardSidebar
            steps={WIZARD_STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
            completionPercentage={calculateCompletionPercentage()}
          />
          
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-6">
              <CarePlanWizardSteps
                currentStep={currentStep}
                form={form}
                clientId={clientId}
              />
            </div>
            
            <CarePlanWizardFooter
              currentStep={currentStep}
              totalSteps={WIZARD_STEPS.length}
              onPrevious={handlePreviousStep}
              onNext={handleNextStep}
              onSaveDraft={handleSaveDraft}
              onFinalize={handleFinalize}
              isLoading={createOrUpdateCarePlan.isPending}
              isDraft={isDraft}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
