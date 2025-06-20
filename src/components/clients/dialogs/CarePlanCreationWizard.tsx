import React, { useState, useEffect, useCallback } from "react";
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

// Helper function to validate and clean UUID fields
const cleanUuidField = (value: string | undefined | null): string | null => {
  if (!value || value.trim() === "") {
    return null;
  }
  return value.trim();
};

// Flexible schema for draft mode - all fields optional
const carePlanDraftSchema = z.object({
  // Step 1: Basic Information - all optional for drafts
  title: z.string().optional(),
  provider_type: z.enum(["staff", "external"]).optional(),
  staff_id: z.string().optional().nullable().transform(cleanUuidField),
  provider_name: z.string().optional(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  review_date: z.date().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  care_plan_type: z.string().default("standard"),
  
  // All other steps - completely optional
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

  about_me: z.object({
    life_history: z.string().optional(),
    interests_hobbies: z.array(z.string()).optional(),
    personality_traits: z.string().optional(),
    communication_style: z.string().optional(),
    important_people: z.string().optional(),
    meaningful_activities: z.string().optional(),
  }).optional(),

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

  goals: z.array(z.object({
    description: z.string().optional(),
    target_date: z.date().optional(),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
    measurable_outcome: z.string().optional(),
  })).optional(),

  activities: z.array(z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    frequency: z.string().optional(),
    duration: z.string().optional(),
    time_of_day: z.string().optional(),
  })).optional(),

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

  risk_assessments: z.array(z.object({
    risk_type: z.string().optional(),
    risk_level: z.enum(["low", "medium", "high"]).optional(),
    risk_factors: z.array(z.string()).optional(),
    mitigation_strategies: z.array(z.string()).optional(),
    review_date: z.date().optional(),
    assessed_by: z.string().optional(),
  })).optional(),

  equipment: z.array(z.object({
    equipment_name: z.string().optional(),
    equipment_type: z.string().optional(),
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

  service_plans: z.array(z.object({
    service_name: z.string().optional(),
    service_category: z.string().optional(),
    provider_name: z.string().optional(),
    start_date: z.date().optional(),
    end_date: z.date().optional(),
    frequency: z.string().optional(),
    duration: z.string().optional(),
    goals: z.array(z.string()).optional(),
    notes: z.string().optional(),
  })).optional(),

  service_actions: z.array(z.object({
    service_name: z.string().optional(),
    service_category: z.string().optional(),
    provider_name: z.string().optional(),
    start_date: z.date().optional(),
    end_date: z.date().optional(),
    frequency: z.string().optional(),
    duration: z.string().optional(),
    schedule_details: z.string().optional(),
    goals: z.array(z.string()).optional(),
    notes: z.string().optional(),
  })).optional(),

  documents: z.array(z.object({
    name: z.string().optional(),
    type: z.string().optional(),
    upload_date: z.date().optional(),
    uploaded_by: z.string().optional(),
    file_path: z.string().optional(),
    file_size: z.string().optional(),
  })).optional(),

  notes: z.string().optional(),
  additional_notes: z.string().optional(),
});

// Strict schema for final submission
const carePlanFinalSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  provider_type: z.enum(["staff", "external"]),
  staff_id: z.string().optional().nullable().transform(cleanUuidField),
  provider_name: z.string().optional(),
  start_date: z.date(),
  end_date: z.date().optional(),
  review_date: z.date().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  care_plan_type: z.string().default("standard"),
  // ... other required fields for final submission
}).and(carePlanDraftSchema);

type CarePlanFormData = z.infer<typeof carePlanDraftSchema>;

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

// Enhanced serialization functions
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
  const [isDraft, setIsDraft] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const { toast } = useToast();
  const { id: branchId } = useParams();
  const queryClient = useQueryClient();

  const form = useForm<CarePlanFormData>({
    resolver: zodResolver(carePlanDraftSchema),
    defaultValues: {
      title: "",
      provider_type: "staff",
      staff_id: null,
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

  // Create draft immediately when wizard opens
  const createInitialDraft = useCallback(async () => {
    if (carePlanId || !clientId) return;

    try {
      const { data: draft, error } = await supabase
        .from('client_care_plans')
        .insert({
          client_id: clientId,
          title: "Untitled Care Plan",
          provider_name: "",
          start_date: new Date().toISOString().split('T')[0],
          status: 'draft',
          priority: 'medium',
          care_plan_type: 'standard',
          auto_save_data: serializeForJSON(form.getValues()),
          last_step_completed: 1,
          completion_percentage: 0,
        })
        .select()
        .single();

      if (error) throw error;

      setCarePlanId(draft.id);
      setLastSaved(new Date());
      console.log('Initial draft created:', draft.id);
    } catch (error) {
      console.error('Error creating initial draft:', error);
      toast({
        title: "Error",
        description: "Failed to create draft. Please try again.",
        variant: "destructive",
      });
    }
  }, [clientId, carePlanId, form, toast]);

  // Auto-save functionality with debouncing
  const performAutoSave = useCallback(async () => {
    if (!carePlanId || !open || isAutoSaving) return;

    setIsAutoSaving(true);
    try {
      const formData = form.getValues();
      const serializedFormData = serializeForJSON(formData);

      await supabase
        .from('client_care_plans')
        .update({
          auto_save_data: serializedFormData,
          last_step_completed: currentStep,
          completion_percentage: calculateCompletionPercentage(),
          updated_at: new Date().toISOString(),
          title: formData.title || "Untitled Care Plan",
        })
        .eq('id', carePlanId);

      setLastSaved(new Date());
      console.log('Auto-saved successfully');
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [carePlanId, currentStep, form, open, isAutoSaving]);

  // Auto-save on form changes
  useEffect(() => {
    if (!carePlanId || !open) return;

    const subscription = form.watch(() => {
      const timeoutId = setTimeout(performAutoSave, 2000); // Auto-save after 2 seconds of inactivity
      return () => clearTimeout(timeoutId);
    });

    return () => subscription.unsubscribe();
  }, [carePlanId, open, form, performAutoSave]);

  // Periodic auto-save
  useEffect(() => {
    if (!carePlanId || !open) return;

    const autoSaveInterval = setInterval(performAutoSave, 30000); // Auto-save every 30 seconds
    return () => clearInterval(autoSaveInterval);
  }, [carePlanId, open, performAutoSave]);

  // Create initial draft when wizard opens
  useEffect(() => {
    if (open && !draftCarePlanId) {
      createInitialDraft();
    }
  }, [open, draftCarePlanId, createInitialDraft]);

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
      setLastSaved(new Date(data.updated_at));
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

      // Use strict validation only for final submission
      if (!saveAsDraft) {
        const validationResult = carePlanFinalSchema.safeParse(formData);
        if (!validationResult.success) {
          throw new Error("Please complete all required fields before finalizing");
        }
      }

      const serializedFormData = serializeForJSON(formData);

      let carePlan;
      if (carePlanId) {
        // Update existing care plan
        const updateData: any = {
          auto_save_data: serializedFormData,
          last_step_completed: currentStep,
          completion_percentage: calculateCompletionPercentage(),
          updated_at: new Date().toISOString(),
        };

        // Only update core fields if they exist and are not empty
        if (formData.title) updateData.title = formData.title;
        if (formData.provider_name) updateData.provider_name = formData.provider_name;
        
        // Handle staff_id with proper null checking
        const cleanStaffId = cleanUuidField(formData.staff_id);
        if (cleanStaffId !== null) {
          updateData.staff_id = cleanStaffId;
        } else {
          updateData.staff_id = null;
        }
        
        if (formData.start_date) updateData.start_date = formData.start_date.toISOString().split('T')[0];
        if (formData.end_date) updateData.end_date = formData.end_date.toISOString().split('T')[0];
        if (formData.review_date) updateData.review_date = formData.review_date.toISOString().split('T')[0];
        if (formData.priority) updateData.priority = formData.priority;
        if (formData.care_plan_type) updateData.care_plan_type = formData.care_plan_type;
        if (formData.notes) updateData.notes = formData.notes;

        updateData.status = saveAsDraft ? 'draft' : 'active';

        const { data: updated, error } = await supabase
          .from('client_care_plans')
          .update(updateData)
          .eq('id', carePlanId)
          .select()
          .single();

        if (error) throw error;
        carePlan = updated;
      } else {
        // Create new care plan (should not happen with immediate draft creation)
        const cleanStaffId = cleanUuidField(formData.staff_id);
        
        const { data: created, error } = await supabase
          .from('client_care_plans')
          .insert({
            client_id: clientId,
            title: formData.title || "Untitled Care Plan",
            provider_name: formData.provider_name || "",
            staff_id: cleanStaffId,
            start_date: formData.start_date ? formData.start_date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            end_date: formData.end_date ? formData.end_date.toISOString().split('T')[0] : null,
            review_date: formData.review_date ? formData.review_date.toISOString().split('T')[0] : null,
            status: saveAsDraft ? 'draft' : 'active',
            priority: formData.priority || 'medium',
            care_plan_type: formData.care_plan_type || 'standard',
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

      // Save related data for finalized care plans
      if (!saveAsDraft) {
        await saveRelatedData(carePlan.id, formData);
      }

      return carePlan;
    },
    onSuccess: (carePlan, { saveAsDraft }) => {
      queryClient.invalidateQueries({ queryKey: ['care-plans'] });
      queryClient.invalidateQueries({ queryKey: ['client-care-plans', clientId] });
      
      setLastSaved(new Date());
      setIsDraft(saveAsDraft);
      
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
        description: error.message || "Failed to save care plan. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Save related data for finalized care plans
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
        if (goal.description) {
          await supabase
            .from('client_care_plan_goals')
            .insert({
              care_plan_id: carePlanId,
              description: goal.description,
              status: 'not-started',
            });
        }
      }
    }

    // Save activities
    if (formData.activities && formData.activities.length > 0) {
      for (const activity of formData.activities) {
        if (activity.name) {
          await supabase
            .from('client_activities')
            .insert({
              care_plan_id: carePlanId,
              name: activity.name,
              description: activity.description,
              frequency: activity.frequency || 'daily',
              status: 'active',
            });
        }
      }
    }

    // Save risk assessments
    if (formData.risk_assessments && formData.risk_assessments.length > 0) {
      for (const risk of formData.risk_assessments) {
        if (risk.risk_type) {
          await supabase
            .from('client_risk_assessments')
            .insert({
              client_id: clientId,
              risk_type: risk.risk_type,
              risk_level: risk.risk_level || 'low',
              risk_factors: risk.risk_factors,
              mitigation_strategies: risk.mitigation_strategies,
              assessment_date: new Date().toISOString().split('T')[0],
              assessed_by: risk.assessed_by || 'System',
              review_date: risk.review_date ? risk.review_date.toISOString().split('T')[0] : null,
            });
        }
      }
    }

    // Save equipment
    if (formData.equipment && formData.equipment.length > 0) {
      for (const equip of formData.equipment) {
        if (equip.equipment_name) {
          await supabase
            .from('client_equipment')
            .insert({
              client_id: clientId,
              equipment_name: equip.equipment_name,
              equipment_type: equip.equipment_type || 'Other',
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
    }

    // Save service actions
    if (formData.service_actions && formData.service_actions.length > 0) {
      for (const action of formData.service_actions) {
        if (action.service_name && action.start_date) {
          await supabase
            .from('client_service_actions')
            .insert({
              client_id: clientId,
              care_plan_id: carePlanId,
              service_name: action.service_name,
              service_category: action.service_category || 'General',
              provider_name: action.provider_name || 'TBD',
              start_date: action.start_date.toISOString().split('T')[0],
              end_date: action.end_date ? action.end_date.toISOString().split('T')[0] : null,
              frequency: action.frequency || 'daily',
              duration: action.duration || '1 hour',
              schedule_details: action.schedule_details,
              goals: action.goals,
              notes: action.notes,
            });
        }
      }
    }
  };

  const calculateCompletionPercentage = () => {
    const formData = form.getValues();
    let completedFields = 0;
    let totalFields = 0;

    // Count basic info fields
    totalFields += 3; // title, provider_type, start_date
    if (formData.title) completedFields++;
    if (formData.provider_type) completedFields++;
    if (formData.start_date) completedFields++;

    // Count other sections
    if (formData.personal_info && Object.values(formData.personal_info).some(v => v)) {
      completedFields++;
    }
    totalFields++;

    if (formData.about_me && Object.values(formData.about_me).some(v => v)) {
      completedFields++;
    }
    totalFields++;

    if (formData.medical_info && Object.values(formData.medical_info).some(v => v)) {
      completedFields++;
    }
    totalFields++;

    if (formData.goals && formData.goals.length > 0) {
      completedFields++;
    }
    totalFields++;

    if (formData.activities && formData.activities.length > 0) {
      completedFields++;
    }
    totalFields++;

    return Math.round((completedFields / totalFields) * 100);
  };

  const markStepCompleted = async (stepNumber: number) => {
    if (!carePlanId) return;

    try {
      const formData = form.getValues();
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
    // Always allow navigation, no validation required for drafts
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
  };

  const handleFinalize = () => {
    const formData = form.getValues();
    createOrUpdateCarePlan.mutate({ formData, saveAsDraft: false });
  };

  const handleStepClick = (stepNumber: number) => {
    // Always allow free navigation between steps
    setCurrentStep(stepNumber);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="text-xl font-semibold text-blue-600 flex items-center justify-between">
            <span>
              {draftCarePlanId ? "Edit Care Plan" : "Create Care Plan"} - Step {currentStep} of {WIZARD_STEPS.length}
            </span>
            <div className="flex items-center gap-4 text-sm font-normal">
              {isDraft && (
                <span className="text-amber-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                  Draft
                </span>
              )}
              {lastSaved && (
                <span className="text-gray-500">
                  {isAutoSaving ? "Saving..." : `Saved ${lastSaved.toLocaleTimeString()}`}
                </span>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-1 min-h-0">
          <CarePlanWizardSidebar
            steps={WIZARD_STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
            completionPercentage={calculateCompletionPercentage()}
          />
          
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-6">
              <CarePlanWizardSteps
                currentStep={currentStep}
                form={form}
                clientId={clientId}
              />
            </div>
            
            <div className="shrink-0">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
