
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

const wizardSteps = [
  { id: 1, name: "Basic Information", description: "Care plan title and basic details" },
  { id: 2, name: "Personal Information", description: "Client personal details" },
  { id: 3, name: "About Me", description: "Client preferences and background" },
  { id: 4, name: "Medical Information", description: "Health conditions and medications" },
  { id: 5, name: "Goals", description: "Care goals and objectives" },
  { id: 6, name: "Activities", description: "Daily activities and routines" },
  { id: 7, name: "Personal Care", description: "Personal care requirements" },
  { id: 8, name: "Dietary", description: "Dietary needs and restrictions" },
  { id: 9, name: "Risk Assessments", description: "Safety and risk evaluations" },
  { id: 10, name: "Equipment", description: "Required equipment and aids" },
  { id: 11, name: "Service Plans", description: "Service delivery plans" },
  { id: 12, name: "Service Actions", description: "Specific service actions" },
  { id: 13, name: "Documents", description: "Supporting documents" },
  { id: 14, name: "Review", description: "Review and finalize care plan" },
];

export function CarePlanCreationWizard({
  isOpen,
  onClose,
  clientId,
  carePlanId
}: CarePlanCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [clientDataLoaded, setClientDataLoaded] = useState(false);
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
      risk_assessments: [], // Changed from {} to []
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
    savedCarePlanId,
  } = useCarePlanDraft(clientId, carePlanId);

  const { createCarePlan, isCreating } = useCarePlanCreation();

  // Fetch client profile data
  const { data: clientProfile, isLoading: isClientLoading } = useClientProfile(clientId);

  // Pre-populate form with client data when client profile is loaded
  useEffect(() => {
    if (clientProfile && !isDraftLoading && !clientDataLoaded) {
      console.log('Pre-populating form with client data:', clientProfile);
      
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
    }
  }, [clientProfile, isDraftLoading, clientDataLoaded, form]);

  // Load draft data when available (this should run after client data is loaded)
  useEffect(() => {
    if (draftData?.auto_save_data && !isDraftLoading && clientDataLoaded) {
      const savedData = draftData.auto_save_data;
      
      console.log('Loading draft data:', savedData);
      
      // Set form values from saved data (this will override client data where draft exists)
      Object.keys(savedData).forEach((key) => {
        if (savedData[key] !== undefined) {
          form.setValue(key as any, savedData[key]);
        }
      });

      // Set current step from saved data
      if (draftData.last_step_completed) {
        setCurrentStep(draftData.last_step_completed);
      }
      
      console.log('Draft data loaded successfully');
    }
  }, [draftData, isDraftLoading, clientDataLoaded, form]);

  // Auto-save on form changes
  useEffect(() => {
    const subscription = form.watch((data) => {
      if (isOpen && savedCarePlanId && clientDataLoaded) {
        autoSave(data, currentStep);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, autoSave, currentStep, isOpen, savedCarePlanId, clientDataLoaded]);

  // Calculate completed steps based on form data
  const getCompletedSteps = () => {
    const formData = form.getValues();
    const completedSteps: number[] = [];

    // Check each step for completion
    if (formData.title?.trim()) completedSteps.push(1);
    if (formData.personal_info && Object.keys(formData.personal_info).length > 0) completedSteps.push(2);
    if (formData.about_me && Object.keys(formData.about_me).length > 0) completedSteps.push(3);
    if (formData.medical_info && Object.keys(formData.medical_info).length > 0) completedSteps.push(4);
    if (formData.goals && formData.goals.length > 0) completedSteps.push(5);
    if (formData.activities && formData.activities.length > 0) completedSteps.push(6);
    if (formData.personal_care && Object.keys(formData.personal_care).length > 0) completedSteps.push(7);
    if (formData.dietary && Object.keys(formData.dietary).length > 0) completedSteps.push(8);
    if (formData.risk_assessments && formData.risk_assessments.length > 0) completedSteps.push(9); // Fixed to check array length
    if (formData.equipment && Object.keys(formData.equipment).length > 0) completedSteps.push(10);
    if (formData.service_plans && Object.keys(formData.service_plans).length > 0) completedSteps.push(11);
    if (formData.service_actions && Object.keys(formData.service_actions).length > 0) completedSteps.push(12);
    if (formData.documents && Object.keys(formData.documents).length > 0) completedSteps.push(13);
    
    // Step 14 (Review) is considered completed when ready to finalize
    if (completedSteps.length >= 3) completedSteps.push(14);

    return completedSteps;
  };

  const handleStepClick = (stepNumber: number) => {
    setCurrentStep(stepNumber);
  };

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
        status: 'pending_approval',
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
  const completedSteps = getCompletedSteps();

  // Show loading state while client data is being fetched
  const isLoading = isClientLoading || isDraftLoading || !clientDataLoaded;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>
            {carePlanId ? "Edit Care Plan Draft" : "Create Care Plan"}
            {clientProfile && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                for {clientProfile.first_name} {clientProfile.last_name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading client information...</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <CarePlanWizardSidebar
              steps={wizardSteps}
              currentStep={currentStep}
              completedSteps={completedSteps}
              onStepClick={handleStepClick}
              completionPercentage={draftData?.completion_percentage || 0}
            />
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 pb-24">
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
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
