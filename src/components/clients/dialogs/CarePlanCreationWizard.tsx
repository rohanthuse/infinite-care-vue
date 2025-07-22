
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CarePlanWizardSteps } from "./wizard/CarePlanWizardSteps";
import { CarePlanWizardFooter } from "./wizard/CarePlanWizardFooter";
import { useCarePlanDraft } from "@/hooks/useCarePlanDraft";
import { useCarePlanCreation } from "@/hooks/useCarePlanCreation";
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
  medical_info: z.any().optional(),
  goals: z.array(z.any()).optional(),
  activities: z.array(z.any()).optional(),
  personal_care: z.any().optional(),
  dietary: z.any().optional(),
  risk_assessments: z.any().optional(),
  equipment: z.any().optional(),
  service_plans: z.any().optional(),
  service_actions: z.any().optional(),
  documents: z.any().optional(),
  additional_notes: z.string().optional(),
});

interface CarePlanCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  carePlanId?: string;
}

export function CarePlanCreationWizard({
  isOpen,
  onClose,
  clientId,
  carePlanId
}: CarePlanCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 14;
  
  const form = useForm({
    resolver: zodResolver(carePlanSchema),
    defaultValues: {
      title: "",
      provider_name: "",
      provider_type: "individual",
      start_date: new Date().toISOString().split('T')[0],
      priority: "medium" as const,
      care_plan_type: "standard",
      personal_info: {},
      about_me: {},
      medical_info: {},
      goals: [],
      activities: [],
      personal_care: {},
      dietary: {},
      risk_assessments: {},
      equipment: {},
      service_plans: {},
      service_actions: {},
      documents: {},
      additional_notes: "",
    },
  });

  const { 
    draftData, 
    isDraftLoading, 
    saveDraft, 
    autoSave, 
    isSaving,
    savedCarePlanId 
  } = useCarePlanDraft(clientId, carePlanId);

  const { createCarePlan, isCreating } = useCarePlanCreation();

  // Load draft data when available
  useEffect(() => {
    if (draftData?.auto_save_data && !isDraftLoading) {
      const savedData = draftData.auto_save_data;
      
      // Set form values from saved data
      Object.keys(savedData).forEach((key) => {
        if (savedData[key] !== undefined) {
          form.setValue(key as any, savedData[key]);
        }
      });

      // Set current step from saved data
      if (draftData.last_step_completed) {
        setCurrentStep(draftData.last_step_completed);
      }
    }
  }, [draftData, isDraftLoading, form]);

  // Auto-save on form changes
  useEffect(() => {
    const subscription = form.watch((data) => {
      if (isOpen && savedCarePlanId) {
        autoSave(data, currentStep);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, autoSave, currentStep, isOpen, savedCarePlanId]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDraft = async () => {
    const formData = form.getValues();
    await saveDraft(formData, currentStep);
  };

  const handleFinalize = async () => {
    try {
      const formData = form.getValues();
      
      // First save as draft to get the latest data
      await saveDraft(formData, currentStep);
      
      // Then finalize the care plan - set status to pending_approval for staff approval workflow
      await createCarePlan({
        ...formData,
        client_id: clientId,
        status: 'pending_approval', // Changed from 'active' to follow staff approval workflow
        care_plan_id: savedCarePlanId,
      });

      toast.success("Care plan sent for staff approval successfully!");
      onClose();
    } catch (error) {
      console.error('Error finalizing care plan:', error);
      toast.error("Failed to finalize care plan. Please try again.");
    }
  };

  const formData = form.watch();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {carePlanId ? "Edit Care Plan Draft" : "Create Care Plan"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pb-24 px-1">
          <CarePlanWizardSteps 
            currentStep={currentStep} 
            form={form} 
            clientId={clientId}
          />
        </div>

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
      </DialogContent>
    </Dialog>
  );
}
