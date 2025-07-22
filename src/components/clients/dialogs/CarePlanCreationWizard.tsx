import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CarePlanWizardSidebar } from "./wizard/CarePlanWizardSidebar";
import { CarePlanWizardSteps } from "./wizard/CarePlanWizardSteps";
import { CarePlanWizardFooter } from "./wizard/CarePlanWizardFooter";
import { useCarePlanDraft } from "@/hooks/useCarePlanDraft";
import { useQuery } from "@tanstack/react-query";

const carePlanSchema = z.object({
  title: z.string().min(1, "Title is required"),
  start_date: z.date({
    required_error: "Start date is required",
  }),
  end_date: z.date().optional(),
  review_date: z.date().optional(),
  priority: z.enum(["low", "medium", "high"]),
  care_plan_type: z.enum(["standard", "intensive", "respite", "palliative", "rehabilitation"]),
  provider_type: z.enum(["staff", "external"]),
  staff_id: z.string().optional(),
  provider_name: z.string().optional(),
  personal_info: z.object({
    gp_name: z.string().optional(),
    gp_phone: z.string().optional(),
    gp_practice: z.string().optional(),
    emergency_contact_name: z.string().optional(),
    emergency_contact_phone: z.string().optional(),
    emergency_contact_relationship: z.string().optional(),
  }).optional(),
  about_me: z.object({
    preferred_name: z.string().optional(),
    gender: z.string().optional(),
    religion: z.string().optional(),
    education: z.string().optional(),
    occupation: z.string().optional(),
    relationship_status: z.string().optional(),
    sexual_orientation: z.string().optional(),
    living_situation: z.string().optional(),
    values_beliefs: z.string().optional(),
    life_history: z.string().optional(),
    hobbies: z.string().optional(),
    summary: z.string().optional(),
    communication_method: z.string().optional(),
  }).optional(),
  medical_info: z.object({
    medical_conditions: z.string().optional(),
    medications: z.string().optional(),
    allergies: z.string().optional(),
    hospitalizations: z.string().optional(),
    immunizations: z.string().optional(),
    mental_health: z.string().optional(),
    cognitive_status: z.string().optional(),
    mobility_status: z.string().optional(),
    sensory_impairments: z.string().optional(),
    pain_management: z.string().optional(),
  }).optional(),
  goals: z.array(z.object({
    category: z.string(),
    description: z.string(),
    targetDate: z.date().optional(),
    priority: z.enum(["low", "medium", "high"]),
    status: z.enum(["not_started", "in_progress", "completed", "on_hold"]),
    notes: z.string().optional(),
  })).optional(),
  activities: z.array(z.object({
    name: z.string(),
    description: z.string(),
    frequency: z.string(),
    duration: z.string(),
    location: z.string().optional(),
    equipment_needed: z.string().optional(),
    staff_notes: z.string().optional(),
  })).optional(),
  personal_care: z.object({
    bathing: z.string().optional(),
    dressing: z.string().optional(),
    grooming: z.string().optional(),
    toileting: z.string().optional(),
    mobility: z.string().optional(),
    feeding: z.string().optional(),
  }).optional(),
  dietary: z.object({
    dietaryRestrictions: z.array(z.string()).optional(),
    foodAllergies: z.array(z.string()).optional(),
    foodPreferences: z.array(z.string()).optional(),
    textureModifications: z.string().optional(),
    nutritionalNeeds: z.string().optional(),
    feedingAssistance: z.string().optional(),
    specialEquipment: z.string().optional(),
    fluidRestrictions: z.string().optional(),
    supplements: z.array(z.string()).optional(),
    weightMonitoring: z.boolean().optional(),
  }).optional(),
  risk_assessments: z.array(z.object({
    type: z.string(),
    level: z.enum(["low", "medium", "high", "critical"]),
    description: z.string(),
    mitigation_strategies: z.string(),
    review_date: z.date().optional(),
    assessor_name: z.string().optional(),
  })).optional(),
  equipment: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string(),
    supplier: z.string().optional(),
    maintenance_schedule: z.string().optional(),
    safety_instructions: z.string().optional(),
  })).optional(),
  service_plans: z.array(z.object({
    service_type: z.string(),
    description: z.string(),
    frequency: z.string(),
    duration: z.string(),
    provider: z.string().optional(),
    cost: z.number().optional(),
    notes: z.string().optional(),
  })).optional(),
  service_actions: z.array(z.object({
    title: z.string(),
    description: z.string(),
    frequency: z.string(),
    duration: z.string(),
    assigned_to: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]),
    status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
    due_date: z.date().optional(),
  })).optional(),
  documents: z.array(z.object({
    name: z.string(),
    type: z.string(),
    url: z.string(),
    uploaded_at: z.date().optional(),
    description: z.string().optional(),
  })).optional(),
});

interface CarePlanCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  carePlanId?: string;
  onSuccess?: () => void;
}

const steps = [
  { id: 1, name: "Basic Information", description: "Care plan details" },
  { id: 2, name: "Personal Information", description: "Contact & emergency info" },
  { id: 3, name: "About Me", description: "Personal background" },
  { id: 4, name: "Medical Information", description: "Health conditions & medications" },
  { id: 5, name: "Goals", description: "Care objectives" },
  { id: 6, name: "Activities", description: "Daily activities" },
  { id: 7, name: "Personal Care", description: "Care assistance needs" },
  { id: 8, name: "Dietary Requirements", description: "Nutrition & feeding" },
  { id: 9, name: "Risk Assessments", description: "Safety evaluations" },
  { id: 10, name: "Equipment", description: "Required equipment" },
  { id: 11, name: "Service Plans", description: "Service arrangements" },
  { id: 12, name: "Service Actions", description: "Action items" },
  { id: 13, name: "Documents", description: "Upload documents" },
  { id: 14, name: "Review", description: "Final review" },
];

export function CarePlanCreationWizard({
  open,
  onOpenChange,
  clientId,
  clientName,
  carePlanId,
  onSuccess,
}: CarePlanCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof carePlanSchema>>({
    resolver: zodResolver(carePlanSchema),
    defaultValues: {
      title: `Comprehensive Care Plan for ${clientName}`,
      priority: "medium",
      care_plan_type: "standard",
      provider_type: "staff",
      personal_info: {},
      about_me: {},
      medical_info: {},
      goals: [],
      activities: [],
      personal_care: {},
      dietary: {
        dietaryRestrictions: [],
        foodAllergies: [],
        foodPreferences: [],
        supplements: [],
        weightMonitoring: false,
      },
      risk_assessments: [],
      equipment: [],
      service_plans: [],
      service_actions: [],
      documents: [],
    },
  });

  const {
    saveDraft,
    loadDraft,
    deleteDraft,
    activateDraft,
    draftData,
    isDraft,
    isSaving,
    lastSaved,
  } = useCarePlanDraft();

  const { data: staffMembers } = useQuery({
    queryKey: ['staff-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('id, first_name, last_name, email')
        .eq('status', 'Active');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Load existing care plan data if editing
  useEffect(() => {
    if (carePlanId && open) {
      loadDraft(clientId, carePlanId);
    }
  }, [carePlanId, open, clientId, loadDraft]);

  // Load draft data into form when available
  useEffect(() => {
    if (draftData && open) {
      try {
        const savedData = draftData.auto_save_data;
        
        form.reset(savedData as any);
        
        if (draftData.last_step_completed) {
          setCurrentStep(draftData.last_step_completed);
        }
        
        toast.success("Draft loaded successfully");
      } catch (error) {
        console.error('Error loading draft data:', error);
        toast.error("Failed to load draft data");
      }
    }
  }, [draftData, form, open]);

  // Auto-save functionality with debounce
  useEffect(() => {
    if (!open || !clientId) return;

    const subscription = form.watch((data) => {
      if (Object.keys(form.formState.dirtyFields).length > 0) {
        const timeoutId = setTimeout(() => {
          handleSaveDraft();
        }, 30000); // Auto-save after 30 seconds of inactivity

        return () => clearTimeout(timeoutId);
      }
    });

    return subscription;
  }, [form, open, clientId]);

  const handleSaveDraft = async () => {
    const data = form.getValues();
    const draftId = draftData?.id || carePlanId;
    
    try {
      await saveDraft({
        clientId,
        formData: data,
        currentStep,
        carePlanId: draftId,
      });
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error("Failed to save draft");
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCompletedSteps(prev => [...new Set([...prev, currentStep])]);
      setCurrentStep(prev => prev + 1);
      handleSaveDraft();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepClick = (stepNumber: number) => {
    setCurrentStep(stepNumber);
  };

  const calculateCompletionPercentage = () => {
    return Math.round((completedSteps.length / steps.length) * 100);
  };

  const onSubmit = async (data: z.infer<typeof carePlanSchema>) => {
    setIsLoading(true);
    
    try {
      const draftId = draftData?.id;
      const savedCarePlanId = carePlanId;
      
      if (draftId || savedCarePlanId) {
        const carePlanId = draftId || savedCarePlanId;
        
        const finalData: any = {
          title: data.title,
          start_date: data.start_date.toISOString().split('T')[0],
          end_date: data.end_date ? data.end_date.toISOString().split('T')[0] : null,
          review_date: data.review_date ? data.review_date.toISOString().split('T')[0] : null,
          priority: data.priority,
          care_plan_type: data.care_plan_type,
          status: 'active',
          auto_save_data: data,
          last_step_completed: 14,
          completion_percentage: 100,
        };

        // Handle provider assignment
        if (data.provider_type === 'staff' && data.staff_id) {
          const staffMember = staffMembers?.find(s => s.id === data.staff_id);
          finalData.staff_id = data.staff_id;
          finalData.provider_name = staffMember ? `${staffMember.first_name} ${staffMember.last_name}` : 'Unknown Staff';
        } else {
          finalData.provider_name = data.provider_name || 'Not Assigned';
        }

        const { error } = await supabase
          .from('client_care_plans')
          .update(finalData)
          .eq('id', carePlanId);

        if (error) throw error;

        if (draftId) {
          await activateDraft(draftId);
        }
      } else {
        // Create new care plan
        const newCarePlan = {
          client_id: clientId,
          title: data.title,
          start_date: data.start_date.toISOString().split('T')[0],
          end_date: data.end_date ? data.end_date.toISOString().split('T')[0] : null,
          review_date: data.review_date ? data.review_date.toISOString().split('T')[0] : null,
          priority: data.priority,
          care_plan_type: data.care_plan_type,
          status: 'active',
          auto_save_data: data,
          completion_percentage: 100,
        };

        if (data.provider_type === 'staff' && data.staff_id) {
          const staffMember = staffMembers?.find(s => s.id === data.staff_id);
          (newCarePlan as any).staff_id = data.staff_id;
          (newCarePlan as any).provider_name = staffMember ? `${staffMember.first_name} ${staffMember.last_name}` : 'Unknown Staff';
        } else {
          (newCarePlan as any).provider_name = data.provider_name || 'Not Assigned';
        }

        const { error } = await supabase
          .from('client_care_plans')
          .insert([newCarePlan]);

        if (error) throw error;
      }

      toast.success("Care plan finalized successfully!");
      onOpenChange(false);
      onSuccess?.();
      
      // Reset form and state
      form.reset();
      setCurrentStep(1);
      setCompletedSteps([]);
      
    } catch (error) {
      console.error('Error finalizing care plan:', error);
      toast.error("Failed to finalize care plan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form and state when closing
    form.reset();
    setCurrentStep(1);
    setCompletedSteps([]);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-7xl h-[90vh] flex flex-col overflow-hidden p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-6 py-4 border-b bg-white flex-shrink-0">
          <DialogTitle className="text-xl font-semibold">
            {isDraft ? "Edit Care Plan Draft" : "Create Care Plan"} - {clientName}
          </DialogTitle>
          {lastSaved && (
            <p className="text-sm text-gray-500 mt-1">
              Last saved: {lastSaved.toLocaleTimeString()}
              {isSaving && <span className="text-blue-600 ml-2">Saving...</span>}
            </p>
          )}
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          <CarePlanWizardSidebar
            steps={steps}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
            completionPercentage={calculateCompletionPercentage()}
          />

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 pb-24">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <CarePlanWizardSteps
                      currentStep={currentStep}
                      form={form}
                      clientId={clientId}
                    />
                  </form>
                </Form>
              </div>
            </div>

            <CarePlanWizardFooter
              currentStep={currentStep}
              totalSteps={steps.length}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onSaveDraft={handleSaveDraft}
              onFinalize={form.handleSubmit(onSubmit)}
              isLoading={isLoading || isSaving}
              isDraft={isDraft}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
